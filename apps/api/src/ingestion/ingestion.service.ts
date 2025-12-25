import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { IngestionRunStatus } from '@pokedex-go/shared';
import { ItemType } from '@prisma/client';
import axios from 'axios';
import { GameMasterParser, ParsedGameMaster, ParsedPokemon } from './game-master.parser';
import { extractDexNumber } from './pokemon-dex-mapping';

/**
 * Ingestion service for Pokémon GO Game Master data
 * 
 * ASSUMPTIONS FLAGGED:
 * - Game Master JSON structure may change
 * - Field mappings are based on current structure
 * - Some derived values may need manual verification
 */
@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService
  ) {}

  async checkForUpdates(): Promise<{ hasUpdate: boolean; timestamp?: string }> {
    try {
      const mirrorUrl = this.config.get<string>('GAME_MASTER_MIRROR_URL');
      if (!mirrorUrl) {
        return { hasUpdate: false };
      }

      // Fetch just to check timestamp (we could optimize this with HEAD request)
      const response = await axios.get(mirrorUrl, {
        headers: { 'Accept': 'application/json' },
        timeout: 5000,
      });

      const timestamp = response.data?.timestampMs || new Date().toISOString();

      // Get last known timestamp
      let state = await this.prisma.ingestionState.findFirst();
      if (!state) {
        state = await this.prisma.ingestionState.create({
          data: {},
        });
      }

      const hasUpdate = state.lastTimestamp !== timestamp;

      return { hasUpdate, timestamp };
    } catch (error) {
      this.logger.error('Error checking for updates', error);
      return { hasUpdate: false };
    }
  }

  async fetchGameMaster(): Promise<any> {
    const mirrorUrl = this.config.get<string>('GAME_MASTER_MIRROR_URL');
    if (!mirrorUrl) {
      throw new Error('GAME_MASTER_MIRROR_URL not configured');
    }

    this.logger.log(`Fetching Game Master from ${mirrorUrl}`);
    
    try {
      const response = await axios.get(mirrorUrl, {
        headers: { 'Accept': 'application/json' },
        timeout: 30000,
        validateStatus: (status) => status < 500, // Don't throw on 4xx errors, we'll handle them
      });

      if (response.status >= 400) {
        const errorMsg = `Failed to fetch Game Master: HTTP ${response.status} - ${response.statusText}`;
        this.logger.error(errorMsg);
        throw new Error(errorMsg);
      }

      const data = response.data;
      
      if (!data) {
        throw new Error('Game Master response is empty or null');
      }

      // Log structure for debugging
      this.logger.log(`Game Master fetched. Top-level keys: ${Object.keys(data || {}).join(', ')}`);
      if (data?.itemTemplates) {
        this.logger.log(`Found ${data.itemTemplates.length} item templates`);
      } else if (data?.templates) {
        this.logger.log(`Found ${data.templates.length} templates (using 'templates' key)`);
      } else {
        this.logger.warn(`No 'itemTemplates' or 'templates' found in Game Master JSON`);
      }

      return data;
    } catch (error) {
      // Provide more detailed error information
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          const errorMsg = `Network error: Cannot reach ${mirrorUrl}. Check your internet connection and DNS settings. Error: ${error.message}`;
          this.logger.error(errorMsg);
          throw new Error(errorMsg);
        } else if (error.code === 'ETIMEDOUT') {
          const errorMsg = `Network timeout: Request to ${mirrorUrl} timed out after 30 seconds. The server may be slow or unreachable.`;
          this.logger.error(errorMsg);
          throw new Error(errorMsg);
        } else if (error.response) {
          // Server responded with error status
          const errorMsg = `HTTP ${error.response.status}: ${error.response.statusText}. URL: ${mirrorUrl}`;
          this.logger.error(errorMsg);
          throw new Error(errorMsg);
        } else {
          const errorMsg = `Network error fetching Game Master: ${error.message}. URL: ${mirrorUrl}`;
          this.logger.error(errorMsg);
          throw new Error(errorMsg);
        }
      } else {
        // Non-axios error
        const errorMsg = `Error fetching Game Master: ${error instanceof Error ? error.message : String(error)}`;
        this.logger.error(errorMsg);
        throw new Error(errorMsg);
      }
    }
  }

  async parseGameMaster(gameMasterJson: any): Promise<ParsedGameMaster> {
    this.logger.log('Parsing Game Master data...');
    // Get item sprite CDN URL from config, or use default (PokeMiners)
    const itemSpriteCdn = this.config.get<string>('ITEM_SPRITE_CDN_BASE_URL');
    
    // Fetch item sprite file list from GitHub to create accurate mapping
    let itemSpriteMapping: any = undefined;
    try {
      const fileListResult = await this.fetchItemSpriteFileList();
      if (fileListResult.success && fileListResult.files.length > 0) {
        this.logger.log(`Creating sprite mapping from ${fileListResult.files.length} sprite files...`);
        itemSpriteMapping = this.createItemSpriteMapping(fileListResult.files);
        this.logger.log(`Created mapping for ${Object.keys(itemSpriteMapping).length} items`);
      }
    } catch (error) {
      this.logger.warn('Could not fetch item sprite file list, will use pattern matching', error);
    }
    
    const parsed = GameMasterParser.parse(gameMasterJson, itemSpriteCdn, itemSpriteMapping);
    this.logger.log(`Parsed: ${parsed.pokemon.length} pokemon, ${parsed.moves.length} moves, ${parsed.types.length} types, ${parsed.items.length} items`);
    return parsed;
  }
  
  /**
   * Create a mapping from item IDs to sprite file paths (including subdirectories)
   * Matches item IDs from Game Master to actual sprite file paths from GitHub
   * 
   * This function creates multiple mapping patterns to handle different naming conventions:
   * - greatball_sprite.png -> ITEM_GREAT_BALL, GREAT_BALL, etc.
   * - Berries/bluk_berry.png -> ITEM_BLUK_BERRY, BLUK_BERRY, etc.
   * 
   * @param spriteFiles - Array of file paths, may include subdirectory (e.g., "Berries/bluk_berry.png")
   */
  createItemSpriteMapping(spriteFiles: string[]): Record<string, string> {
    const mapping: Record<string, string> = {};
    
    for (const filePath of spriteFiles) {
      // Extract filename and subdirectory
      const parts = filePath.split('/');
      const filename = parts[parts.length - 1]; // Last part is the filename
      const subdir = parts.length > 1 ? parts.slice(0, -1).join('/') : undefined;
      
      // Remove .png extension
      const baseName = filename.replace(/\.png$/i, '');
      
      // Remove _sprite suffix if present
      let itemName = baseName;
      if (itemName.endsWith('_sprite')) {
        itemName = itemName.substring(0, itemName.length - 7);
      }
      
      // Generate possible item ID patterns from the filename
      const patterns = this.generateItemIdPatternsFromFilename(itemName);
      
      // Add all patterns to mapping, preserving the full path (including subdirectory)
      for (const pattern of patterns) {
        mapping[pattern] = filePath; // Store full path like "Berries/bluk_berry.png"
      }
    }
    
    return mapping;
  }
  
  /**
   * Generate possible item ID patterns from a sprite filename
   * Handles actual naming conventions from PokeMiners repository
   * 
   * Actual patterns:
   * - berry_golden_razz.png -> ITEM_GOLDEN_RAZZ_BERRY
   * - berry_razz.png -> ITEM_RAZZ_BERRY
   * - item_pokeball.png -> ITEM_POKE_BALL
   * - item_greatball.png -> ITEM_GREAT_BALL
   * - item_potion.png -> ITEM_POTION
   * - item_super_potion.png -> ITEM_SUPER_POTION
   */
  private generateItemIdPatternsFromFilename(filename: string): string[] {
    const patterns: string[] = [];
    
    // Remove .png extension
    let baseName = filename.replace(/\.png$/i, '');
    
    // Pattern 1: Handle berry_ prefix (berry_golden_razz -> ITEM_GOLDEN_RAZZ_BERRY)
    if (baseName.startsWith('berry_')) {
      const berryName = baseName.replace(/^berry_/, '');
      // Convert snake_case to ITEM format: golden_razz -> GOLDEN_RAZZ_BERRY
      const berryType = berryName.split('_').map(p => p.toUpperCase()).join('_');
      patterns.push(`ITEM_${berryType}_BERRY`);
      // Also try without _BERRY suffix for backwards compatibility
      patterns.push(`ITEM_${berryType}`);
    }
    
    // Pattern 2: Handle item_ prefix (item_pokeball -> ITEM_POKE_BALL, item_potion -> ITEM_POTION)
    if (baseName.startsWith('item_')) {
      const itemName = baseName.replace(/^item_/, '');
      
      // Check if it's a compound word (pokeball, greatball, etc.)
      const compoundEndings = ['ball', 'potion', 'revive', 'incense', 'lure', 'egg', 'ticket', 'candy', 'stardust', 'incubator'];
      let matched = false;
      
      for (const ending of compoundEndings) {
        if (itemName.toLowerCase().endsWith(ending)) {
          const before = itemName.substring(0, itemName.length - ending.length);
          if (before) {
            // pokeball -> POKE_BALL, greatball -> GREAT_BALL
            const beforeUpper = before.toUpperCase();
            const endingUpper = ending.toUpperCase();
            patterns.push(`ITEM_${beforeUpper}_${endingUpper}`);
            matched = true;
          }
        }
      }
      
      if (!matched) {
        // Not a compound word, use as-is: potion -> ITEM_POTION, super_potion -> ITEM_SUPER_POTION
        const itemType = itemName.toUpperCase().replace(/-/g, '_');
        patterns.push(`ITEM_${itemType}`);
      }
    }
    
    // Pattern 3: Handle numbered items (Item_0101.png -> ITEM_0101)
    if (baseName.match(/^[Ii]tem_\d+/)) {
      const number = baseName.replace(/^[Ii]tem_/, '');
      patterns.push(`ITEM_${number}`);
      patterns.push(number);
      return patterns;
    }
    
    // Pattern 4: Handle Bag_ prefix items (Bag_Dragon_Scale_Sprite.png -> ITEM_DRAGON_SCALE)
    if (baseName.startsWith('Bag_')) {
      const withoutBag = baseName.replace(/^Bag_/, '').replace(/[Ss]prite$/, '');
      const normalized = withoutBag.replace(/-/g, '_').toUpperCase();
      patterns.push(`ITEM_${normalized}`);
      patterns.push(normalized);
    }
    
    // Pattern 5: Handle _sprite suffix (greatball_sprite -> ITEM_GREAT_BALL)
    if (baseName.endsWith('_sprite') || baseName.endsWith('Sprite')) {
      baseName = baseName.replace(/[Ss]prite$/, '').replace(/_$/, '');
      // Try to split compound words
      const wordBoundaries = ['ball', 'berry', 'potion', 'revive', 'incense', 'lure', 'egg', 'ticket', 'candy', 'stardust', 'incubator'];
      for (const word of wordBoundaries) {
        if (baseName.toLowerCase().endsWith(word.toLowerCase())) {
          const before = baseName.substring(0, baseName.length - word.length);
          if (before) {
            patterns.push(`ITEM_${before.toUpperCase()}_${word.toUpperCase()}`);
          }
        }
      }
    }
    
    // Pattern 6: Direct conversion for any remaining patterns
    const withUnderscores = baseName.replace(/-/g, '_');
    if (withUnderscores.includes('_') && !patterns.length) {
      patterns.push(`ITEM_${withUnderscores.toUpperCase()}`);
      patterns.push(withUnderscores.toUpperCase());
    }
    
    return [...new Set(patterns)]; // Remove duplicates
  }

  async stageIngestion(parsed: ParsedGameMaster, runId: string): Promise<IngestionStagingResult> {
    this.logger.log('Staging ingestion data...');

    const result: IngestionStagingResult = {
      types: { added: 0, updated: 0 },
      moves: { added: 0, updated: 0 },
      pokemonSpecies: { added: 0, updated: 0 },
      pokemonForms: { added: 0, updated: 0 },
      items: { added: 0, updated: 0 },
      errors: [],
    };

    try {
      // Stage Types
      for (const typeName of parsed.types) {
        try {
          const existing = await this.prisma.type.findUnique({
            where: { name: typeName },
          });

          if (existing) {
            result.types.updated++;
          } else {
            await this.prisma.type.create({
              data: { name: typeName },
            });
            result.types.added++;
          }
        } catch (error) {
          result.errors.push(`Type ${typeName}: ${error.message}`);
        }
      }

      // Stage Moves
      for (const move of parsed.moves) {
        try {
          const type = await this.prisma.type.findUnique({
            where: { name: move.type },
          });

          if (!type) {
            result.errors.push(`Type ${move.type} not found for move ${move.moveId}`);
            continue;
          }

          const existing = await this.prisma.move.findUnique({
            where: { moveKey: move.moveId },
          });

          if (existing) {
            await this.prisma.move.update({
              where: { id: existing.id },
              data: {
                name: move.name,
                power: move.power,
                energyDelta: move.energyDelta,
                durationMs: move.durationMs,
                category: move.category,
              },
            });
            result.moves.updated++;
          } else {
            await this.prisma.move.create({
              data: {
                moveKey: move.moveId,
                name: move.name,
                typeId: type.id,
                category: move.category,
                power: move.power,
                energyDelta: move.energyDelta,
                durationMs: move.durationMs,
              },
            });
            result.moves.added++;
          }
        } catch (error) {
          result.errors.push(`Move ${move.moveId}: ${error.message}`);
        }
      }

      // Stage Pokémon Species and Forms
      // Group by base pokemonId (without form)
      const pokemonByBase: Record<string, ParsedPokemon[]> = {};
      this.logger.log(`Processing ${parsed.pokemon.length} pokemon entries...`);
      
      for (const pkmn of parsed.pokemon) {
        // Extract base ID: remove POKEMON_ prefix and form suffix
        // The extractDexNumber function handles normalization, but we need a key for grouping
        let baseId = pkmn.pokemonId.toUpperCase().replace(/^POKEMON_/, '');
        
        // Remove form suffix - find the base Pokémon name
        // Strategy: try to find the longest prefix that maps to a valid dex number
        let foundBaseId = baseId;
        let foundDexNumber: number | null = null;
        const parts = baseId.split('_');
        
        // Try progressively shorter prefixes
        for (let i = parts.length; i > 0; i--) {
          const candidate = parts.slice(0, i).join('_');
          const dexNum = extractDexNumber(candidate);
          if (dexNum) {
            foundBaseId = candidate;
            foundDexNumber = dexNum;
            break;
          }
        }
        
        // If we couldn't find a valid base ID, log it and skip
        if (!foundDexNumber) {
          this.logger.warn(`Could not extract dex number for pokemonId: ${pkmn.pokemonId} (normalized: ${baseId})`);
          result.errors.push(`Could not determine dex number for ${pkmn.pokemonId}`);
          continue;
        }
        
        baseId = foundBaseId;
        
        if (!pokemonByBase[baseId]) {
          pokemonByBase[baseId] = [];
        }
        pokemonByBase[baseId].push(pkmn);
      }
      
      this.logger.log(`Grouped into ${Object.keys(pokemonByBase).length} unique species`);

      for (const [baseId, forms] of Object.entries(pokemonByBase)) {
        try {
          // Find default form
          const defaultForm = forms.find(f => f.isDefault) || forms[0];
          
          if (!defaultForm) {
            this.logger.warn(`No forms found for ${baseId}`);
            result.errors.push(`No forms found for ${baseId}`);
            continue;
          }
          
          // Get or create types
          const primaryType = await this.prisma.type.findUnique({
            where: { name: defaultForm.type1 },
          });
          if (!primaryType) {
            const errorMsg = `Primary type ${defaultForm.type1} not found for ${baseId}`;
            this.logger.warn(errorMsg);
            result.errors.push(errorMsg);
            continue;
          }

          const secondaryType = defaultForm.type2
            ? await this.prisma.type.findUnique({
                where: { name: defaultForm.type2 },
              })
            : null;

          // Extract dex number from pokemonId using proper mapping
          const dexNumber = extractDexNumber(baseId);
          if (!dexNumber) {
            const errorMsg = `Could not determine dex number for ${baseId} (this should not happen after grouping)`;
            this.logger.error(errorMsg);
            result.errors.push(errorMsg);
            continue;
          }
          
          this.logger.debug(`Processing ${baseId} (dex #${dexNumber}) with ${forms.length} form(s)`);

          // Create or update species
          let species = await this.prisma.pokemonSpecies.findUnique({
            where: { dexNumber },
          });

          if (species) {
            // Find parent species if parentPokemonId exists
            let parentSpeciesId: string | null = null;
            if (defaultForm.parentPokemonId) {
              const parentDexNumber = extractDexNumber(defaultForm.parentPokemonId);
              if (parentDexNumber) {
                const parentSpecies = await this.prisma.pokemonSpecies.findUnique({
                  where: { dexNumber: parentDexNumber },
                });
                if (parentSpecies) {
                  parentSpeciesId = parentSpecies.id;
                }
              }
            }

            await this.prisma.pokemonSpecies.update({
              where: { id: species.id },
              data: {
                name: this.normalizePokemonName(baseId),
                primaryTypeId: primaryType.id,
                secondaryTypeId: secondaryType?.id,
                familyId: defaultForm.familyId || species.familyId,
                evolutionId: defaultForm.evolutionId || species.evolutionId,
                parentPokemonId: parentSpeciesId || species.parentPokemonId,
              },
            });
            result.pokemonSpecies.updated++;
          } else {
            // Find parent species if parentPokemonId exists
            let parentSpeciesId: string | null = null;
            if (defaultForm.parentPokemonId) {
              const parentDexNumber = extractDexNumber(defaultForm.parentPokemonId);
              if (parentDexNumber) {
                const parentSpecies = await this.prisma.pokemonSpecies.findUnique({
                  where: { dexNumber: parentDexNumber },
                });
                if (parentSpecies) {
                  parentSpeciesId = parentSpecies.id;
                }
              }
            }

            species = await this.prisma.pokemonSpecies.create({
              data: {
                dexNumber,
                name: this.normalizePokemonName(baseId),
                generation: this.estimateGeneration(dexNumber),
                primaryTypeId: primaryType.id,
                secondaryTypeId: secondaryType?.id,
                isLegendary: defaultForm.rarity === 'POKEMON_RARITY_LEGENDARY',
                isMythical: defaultForm.rarity === 'POKEMON_RARITY_MYTHICAL',
                familyId: defaultForm.familyId || null,
                evolutionId: defaultForm.evolutionId || null,
                parentPokemonId: parentSpeciesId,
              },
            });
            result.pokemonSpecies.added++;
          }

          // Create or update forms
          for (const formData of forms) {
            try {
              const existingForm = await this.prisma.pokemonForm.findFirst({
                where: {
                  speciesId: species.id,
                  formKey: formData.form || 'NORMAL',
                },
              });

              if (existingForm) {
                await this.prisma.pokemonForm.update({
                  where: { id: existingForm.id },
                  data: {
                    formName: this.normalizeFormName(formData.form || 'NORMAL'),
                    baseAttack: formData.baseAttack,
                    baseDefense: formData.baseDefense,
                    baseStamina: formData.baseStamina,
                  },
                });
                result.pokemonForms.updated++;

                // Update moves
                await this.updateFormMoves(existingForm.id, formData);
              } else {
                const newForm = await this.prisma.pokemonForm.create({
                  data: {
                    speciesId: species.id,
                    formKey: formData.form || 'NORMAL',
                    formName: this.normalizeFormName(formData.form || 'NORMAL'),
                    isDefault: formData.isDefault,
                    baseAttack: formData.baseAttack,
                    baseDefense: formData.baseDefense,
                    baseStamina: formData.baseStamina,
                  },
                });
                result.pokemonForms.added++;

                // Add moves
                await this.updateFormMoves(newForm.id, formData);
              }
            } catch (error) {
              result.errors.push(`Form ${formData.form} for ${baseId}: ${error.message}`);
            }
          }
        } catch (error) {
          const errorMsg = `Pokemon ${baseId}: ${error.message}`;
          this.logger.error(errorMsg, error);
          result.errors.push(errorMsg);
        }
      }
      
      this.logger.log(`Pokemon staging complete: ${result.pokemonSpecies.added} added, ${result.pokemonSpecies.updated} updated species; ${result.pokemonForms.added} added, ${result.pokemonForms.updated} updated forms`);
      if (result.errors.length > 0) {
        this.logger.warn(`Encountered ${result.errors.length} errors during pokemon staging`);
        // Log first 10 errors for debugging
        result.errors.slice(0, 10).forEach(err => this.logger.warn(`  - ${err}`));
      }

      // Stage Items
      this.logger.log(`Staging ${parsed.items.length} items...`);
      for (const item of parsed.items) {
        try {
          // Map string type to ItemType enum
          let itemType: ItemType;
          try {
            itemType = ItemType[item.type as keyof typeof ItemType];
            if (!itemType) {
              itemType = ItemType.OTHER;
            }
          } catch {
            itemType = ItemType.OTHER;
          }

          const existing = await this.prisma.item.findUnique({
            where: { itemKey: item.itemId },
          });

          if (existing) {
            await this.prisma.item.update({
              where: { id: existing.id },
              data: {
                name: item.name,
                type: itemType,
                description: item.description || null,
                features: item.features || null,
                obtainedFrom: item.obtainedFrom || null,
                spritePath: item.spritePath || null,
              },
            });
            result.items.updated++;
          } else {
            await this.prisma.item.create({
              data: {
                itemKey: item.itemId,
                name: item.name,
                type: itemType,
                description: item.description || null,
                features: item.features || null,
                obtainedFrom: item.obtainedFrom || null,
                spritePath: item.spritePath || null,
              },
            });
            result.items.added++;
          }
        } catch (error) {
          result.errors.push(`Item ${item.itemId}: ${error.message}`);
        }
      }
      
      this.logger.log(`Items staging complete: ${result.items.added} added, ${result.items.updated} updated`);

      // Update ingestion state
      const timestamp = parsed.timestamp || new Date().toISOString();
      let state = await this.prisma.ingestionState.findFirst();
      if (state) {
        await this.prisma.ingestionState.update({
          where: { id: state.id },
          data: {
            lastTimestamp: timestamp,
            lastSuccess: new Date(),
          },
        });
      } else {
        await this.prisma.ingestionState.create({
          data: {
            lastTimestamp: timestamp,
            lastSuccess: new Date(),
          },
        });
      }

      return result;
    } catch (error) {
      this.logger.error('Error staging ingestion', error);
      result.errors.push(`Staging error: ${error.message}`);
      throw error;
    }
  }

  private async updateFormMoves(formId: string, formData: any): Promise<void> {
    // Remove existing moves
    await this.prisma.pokemonFormMove.deleteMany({
      where: { formId },
    });

    // Collect all moves to create, deduplicating within each category
    const movesToCreate: Array<{
      formId: string;
      moveId: string;
      learnMethod: 'FAST' | 'CHARGED' | 'ELITE_FAST' | 'ELITE_CHARGED';
    }> = [];

    // Helper function to add moves from an array, deduplicating by moveKey
    const addMoves = async (
      moveKeys: string[],
      learnMethod: 'FAST' | 'CHARGED' | 'ELITE_FAST' | 'ELITE_CHARGED'
    ) => {
      // Deduplicate move keys
      const uniqueMoveKeys = [...new Set(moveKeys)];
      
      for (const moveKey of uniqueMoveKeys) {
        const move = await this.prisma.move.findUnique({
          where: { moveKey },
        });
        if (move) {
          movesToCreate.push({
            formId,
            moveId: move.id,
            learnMethod,
          });
        }
      }
    };

    // Add moves from each category
    await addMoves(formData.quickMoves || [], 'FAST');
    await addMoves(formData.cinematicMoves || [], 'CHARGED');
    await addMoves(formData.eliteQuickMoves || [], 'ELITE_FAST');
    await addMoves(formData.eliteCinematicMoves || [], 'ELITE_CHARGED');

    // Deduplicate the final array by (formId, moveId, learnMethod) combination
    const uniqueMoves = movesToCreate.filter(
      (move, index, self) =>
        index ===
        self.findIndex(
          (m) =>
            m.formId === move.formId &&
            m.moveId === move.moveId &&
            m.learnMethod === move.learnMethod
        )
    );

    // Use createMany with skipDuplicates as a safety net
    if (uniqueMoves.length > 0) {
      await this.prisma.pokemonFormMove.createMany({
        data: uniqueMoves,
        skipDuplicates: true,
      });
    }
  }


  private normalizePokemonName(pokemonId: string): string {
    return pokemonId
      .replace(/^POKEMON_/, '')
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  }

  private normalizeFormName(form: string): string {
    return form
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Map generation number to region name
   */
  private generationToRegion(generation: number): string | null {
    const mapping: Record<number, string> = {
      1: 'Kanto',
      2: 'Johto',
      3: 'Hoenn',
      4: 'Sinnoh',
      5: 'Unova',
      6: 'Kalos',
      7: 'Alola',
      8: 'Galar',
      9: 'Paldea',
    };
    return mapping[generation] || null;
  }

  /**
   * Populate regions from PokeAPI
   * Fetches Pokemon species data from PokeAPI and maps generations to regions
   */
  private async populateRegionsFromPokeAPI(): Promise<{ regionsCreated: number; pokemonUpdated: number }> {
    const regionsCreated = new Set<string>();
    let pokemonUpdated = 0;
    const errors: string[] = [];

    try {
      // Get all Pokemon species that don't have a region assigned
      const allSpecies = await this.prisma.pokemonSpecies.findMany({
        select: { id: true, dexNumber: true, name: true, generation: true, regionId: true },
        orderBy: { dexNumber: 'asc' },
      });

      this.logger.log(`Processing ${allSpecies.length} Pokemon species for region assignment...`);

      // Process in batches to avoid overwhelming PokeAPI
      const batchSize = 10;
      for (let i = 0; i < allSpecies.length; i += batchSize) {
        const batch = allSpecies.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (species) => {
            try {
              // Skip if already has a region
              if (species.regionId) {
                return;
              }

              // Try to get region from generation first (faster, no API call needed)
              const regionName = this.generationToRegion(species.generation);
              
              if (regionName) {
                // Get or create region
                let region = await this.prisma.region.findUnique({
                  where: { name: regionName },
                });

                if (!region) {
                  region = await this.prisma.region.create({
                    data: { name: regionName },
                  });
                  regionsCreated.add(regionName);
                  this.logger.debug(`Created region: ${regionName}`);
                }

                // Update Pokemon species with region
                await this.prisma.pokemonSpecies.update({
                  where: { id: species.id },
                  data: { regionId: region.id },
                });
                pokemonUpdated++;
              } else {
                // If generation mapping doesn't work, try PokeAPI as fallback
                // This handles edge cases or special Pokemon
                try {
                  const response = await axios.get(
                    `https://pokeapi.co/api/v2/pokemon-species/${species.dexNumber}`,
                    { timeout: 5000 }
                  );

                  const generationUrl = response.data.generation?.url;
                  if (generationUrl) {
                    const genMatch = generationUrl.match(/generation\/(\d+)\//);
                    if (genMatch) {
                      const genNumber = parseInt(genMatch[1], 10);
                      const regionName = this.generationToRegion(genNumber);
                      
                      if (regionName) {
                        let region = await this.prisma.region.findUnique({
                          where: { name: regionName },
                        });

                        if (!region) {
                          region = await this.prisma.region.create({
                            data: { name: regionName },
                          });
                          regionsCreated.add(regionName);
                        }

                        await this.prisma.pokemonSpecies.update({
                          where: { id: species.id },
                          data: { regionId: region.id },
                        });
                        pokemonUpdated++;
                      }
                    }
                  }
                } catch (apiError) {
                  // Silently skip if PokeAPI fails - not critical
                  errors.push(`Failed to fetch PokeAPI data for ${species.name} (#${species.dexNumber}): ${apiError.message}`);
                }
              }

              // Rate limiting: small delay between batches
              if (i > 0 && i % (batchSize * 5) === 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            } catch (error) {
              errors.push(`Error processing ${species.name} (#${species.dexNumber}): ${error.message}`);
            }
          })
        );

        // Small delay between batches to be respectful to PokeAPI
        if (i + batchSize < allSpecies.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      if (errors.length > 0) {
        this.logger.warn(`Encountered ${errors.length} errors during region population`);
        errors.slice(0, 10).forEach(err => this.logger.warn(`  - ${err}`));
      }

      return {
        regionsCreated: regionsCreated.size,
        pokemonUpdated,
      };
    } catch (error) {
      this.logger.error('Error populating regions from PokeAPI', error);
      throw error;
    }
  }

  private estimateGeneration(dexNumber: number): number {
    if (dexNumber <= 151) return 1;
    if (dexNumber <= 251) return 2;
    if (dexNumber <= 386) return 3;
    if (dexNumber <= 493) return 4;
    if (dexNumber <= 649) return 5;
    if (dexNumber <= 721) return 6;
    if (dexNumber <= 809) return 7;
    if (dexNumber <= 905) return 8;
    return 9;
  }

  async runIngestion(): Promise<{ runId: string; summary: string }> {
    const run = await this.prisma.ingestionRun.create({
      data: {
        status: IngestionRunStatus.RUNNING,
      },
    });

    try {
      this.logger.log('Starting ingestion...');

      // 1. Fetch Game Master
      const gameMasterJson = await this.fetchGameMaster();

      // 2. Parse
      const parsed = await this.parseGameMaster(gameMasterJson);

      // 3. Stage (apply immediately for MVP, can add approval later)
      const stagingResult = await this.stageIngestion(parsed, run.id);

      // 4. Populate regions from PokeAPI
      this.logger.log('Populating regions from PokeAPI...');
      const regionResult = await this.populateRegionsFromPokeAPI();
      this.logger.log(`Region population complete: ${regionResult.regionsCreated} regions created, ${regionResult.pokemonUpdated} Pokemon updated`);

      const summary = [
        `Types: +${stagingResult.types.added} / ~${stagingResult.types.updated}`,
        `Moves: +${stagingResult.moves.added} / ~${stagingResult.moves.updated}`,
        `Species: +${stagingResult.pokemonSpecies.added} / ~${stagingResult.pokemonSpecies.updated}`,
        `Forms: +${stagingResult.pokemonForms.added} / ~${stagingResult.pokemonForms.updated}`,
        `Items: +${stagingResult.items.added} / ~${stagingResult.items.updated}`,
        `Regions: ${regionResult.regionsCreated} created, ${regionResult.pokemonUpdated} Pokemon linked`,
        stagingResult.errors.length > 0
          ? `Errors: ${stagingResult.errors.length}`
          : 'No errors',
      ].join(' | ');

      await this.prisma.ingestionRun.update({
        where: { id: run.id },
        data: {
          status: IngestionRunStatus.SUCCESS,
          summary,
          errors:
            stagingResult.errors.length > 0
              ? JSON.stringify(stagingResult.errors)
              : null,
          completedAt: new Date(),
        },
      });

      this.logger.log(`Ingestion completed: ${summary}`);

      return { runId: run.id, summary };
    } catch (error) {
      this.logger.error('Ingestion failed', error);

      await this.prisma.ingestionRun.update({
        where: { id: run.id },
        data: {
          status: IngestionRunStatus.FAILED,
          errors: JSON.stringify([error.message]),
          completedAt: new Date(),
        },
      });

      throw error;
    }
  }

  async runItemsIngestion(): Promise<{ runId: string; summary: string }> {
    const run = await this.prisma.ingestionRun.create({
      data: {
        status: IngestionRunStatus.RUNNING,
      },
    });

    try {
      this.logger.log('Starting items-only ingestion...');

      // 1. Fetch Game Master
      const gameMasterJson = await this.fetchGameMaster();

      // 2. Parse (only items will be processed)
      const parsed = await this.parseGameMaster(gameMasterJson);

      // 3. Stage only items
      const result: IngestionStagingResult = {
        types: { added: 0, updated: 0 },
        moves: { added: 0, updated: 0 },
        pokemonSpecies: { added: 0, updated: 0 },
        pokemonForms: { added: 0, updated: 0 },
        items: { added: 0, updated: 0 },
        errors: [],
      };

      this.logger.log(`Staging ${parsed.items.length} items...`);
      for (const item of parsed.items) {
        try {
          // Map string type to ItemType enum
          let itemType: ItemType;
          try {
            itemType = ItemType[item.type as keyof typeof ItemType];
            if (!itemType) {
              itemType = ItemType.OTHER;
            }
          } catch {
            itemType = ItemType.OTHER;
          }

          const existing = await this.prisma.item.findUnique({
            where: { itemKey: item.itemId },
          });

          if (existing) {
            await this.prisma.item.update({
              where: { id: existing.id },
              data: {
                name: item.name,
                type: itemType,
                description: item.description || null,
                features: item.features || null,
                obtainedFrom: item.obtainedFrom || null,
                spritePath: item.spritePath || null,
              },
            });
            result.items.updated++;
          } else {
            await this.prisma.item.create({
              data: {
                itemKey: item.itemId,
                name: item.name,
                type: itemType,
                description: item.description || null,
                features: item.features || null,
                obtainedFrom: item.obtainedFrom || null,
                spritePath: item.spritePath || null,
              },
            });
            result.items.added++;
          }
        } catch (error) {
          result.errors.push(`Item ${item.itemId}: ${error.message}`);
        }
      }

      const summary = [
        `Items: +${result.items.added} / ~${result.items.updated}`,
        result.errors.length > 0
          ? `Errors: ${result.errors.length}`
          : 'No errors',
      ].join(' | ');

      await this.prisma.ingestionRun.update({
        where: { id: run.id },
        data: {
          status: IngestionRunStatus.SUCCESS,
          summary,
          errors:
            result.errors.length > 0
              ? JSON.stringify(result.errors)
              : null,
          completedAt: new Date(),
        },
      });

      this.logger.log(`Items ingestion completed: ${summary}`);

      return { runId: run.id, summary };
    } catch (error) {
      this.logger.error('Items ingestion failed', error);

      await this.prisma.ingestionRun.update({
        where: { id: run.id },
        data: {
          status: IngestionRunStatus.FAILED,
          summary: `Failed: ${error.message}`,
          errors: JSON.stringify([error.message]),
          completedAt: new Date(),
        },
      });

      throw error;
    }
  }

  async getIngestionHistory() {
    return this.prisma.ingestionRun.findMany({
      orderBy: {
        startedAt: 'desc',
      },
      take: 50,
    });
  }

  async getIngestionState() {
    return this.prisma.ingestionState.findFirst();
  }

  async getCurrentRun() {
    // Get the most recent running ingestion
    const currentRun = await this.prisma.ingestionRun.findFirst({
      where: {
        status: IngestionRunStatus.RUNNING,
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    if (!currentRun) {
      return null;
    }

    // Calculate elapsed time
    const elapsed = Date.now() - currentRun.startedAt.getTime();
    const elapsedSeconds = Math.floor(elapsed / 1000);

    return {
      id: currentRun.id,
      status: currentRun.status,
      startedAt: currentRun.startedAt,
      elapsedSeconds,
      summary: currentRun.summary,
    };
  }

  async fetchItemSpriteFileList(): Promise<{
    success: boolean;
    files: string[]; // Array of relative paths like "Berries/bluk_berry.png" or "greatball_sprite.png"
    error?: string;
  }> {
    try {
      this.logger.log('Fetching item sprite file list from GitHub (recursively)...');
      
      const allFiles: string[] = [];
      
      // Try both path structures (with and without 'assets' prefix)
      const basePaths = ['Images/Items', 'assets/Images/Items'];
      
      for (const basePath of basePaths) {
        this.logger.log(`Trying path: ${basePath}`);
        
        // Fetch files from root Items directory
        await this.fetchFilesFromDirectory(basePath, allFiles);
        this.logger.log(`After root fetch: ${allFiles.length} files`);
        
        // Fetch files from known subdirectories
        const subdirectories = ['Berries', 'Balls', 'Potions', 'Revives', 'Incense', 'Incubators', 'Eggs', 'Evolution', 'Tickets', 'Stones'];
        
        for (const subdir of subdirectories) {
          const beforeCount = allFiles.length;
          await this.fetchFilesFromDirectory(`${basePath}/${subdir}`, allFiles, subdir);
          const afterCount = allFiles.length;
          if (afterCount > beforeCount) {
            this.logger.log(`  Found ${afterCount - beforeCount} files in ${subdir}/`);
          }
        }
        
        // If we found files, break (don't try the other path)
        if (allFiles.length > 0) {
          this.logger.log(`Using path structure: ${basePath} (found ${allFiles.length} total files)`);
          break;
        } else {
          this.logger.warn(`No files found in ${basePath}, trying next path...`);
        }
      }
      
      this.logger.log(`Found ${allFiles.length} item sprite files (including subdirectories)`);
      return {
        success: true,
        files: allFiles,
      };
    } catch (error) {
      this.logger.error('Error fetching item sprite file list', error);
      return {
        success: false,
        files: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  /**
   * Recursively fetch PNG files from a GitHub directory
   * @param path - GitHub API path (e.g., "Images/Items" or "Images/Items/Berries")
   * @param allFiles - Array to accumulate file paths
   * @param subdirPrefix - Optional subdirectory prefix to prepend to filenames (e.g., "Berries/")
   */
  private async fetchFilesFromDirectory(
    path: string,
    allFiles: string[],
    subdirPrefix?: string
  ): Promise<void> {
    try {
      const githubApiUrl = `https://api.github.com/repos/PokeMiners/pogo_assets/contents/${path}?ref=master`;
      const response = await axios.get(githubApiUrl, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'PokedexGo-Ingestion',
        },
        timeout: 15000,
      });

      if (response.data && Array.isArray(response.data)) {
        for (const item of response.data) {
          if (item.type === 'file' && item.name.endsWith('.png')) {
            // Store relative path: "Berries/bluk_berry.png" or "greatball_sprite.png"
            const filePath = subdirPrefix ? `${subdirPrefix}/${item.name}` : item.name;
            allFiles.push(filePath);
            this.logger.debug(`Found file: ${filePath}`);
          } else if (item.type === 'dir') {
            // Recursively fetch from subdirectories
            const newSubdirPrefix = subdirPrefix 
              ? `${subdirPrefix}/${item.name}` 
              : item.name;
            await this.fetchFilesFromDirectory(`${path}/${item.name}`, allFiles, newSubdirPrefix);
          }
        }
      } else if (response.data && response.data.message) {
        // GitHub API error message
        this.logger.warn(`GitHub API error for ${path}: ${response.data.message}`);
      }
    } catch (error) {
      // Log but don't fail - some directories might not exist
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Could not fetch from ${path}: ${errorMsg}`);
      if (axios.isAxiosError(error) && error.response) {
        this.logger.warn(`  Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data).substring(0, 200)}`);
      }
    }
  }

  async inspectItemTemplates(): Promise<{
    totalTemplates: number;
    itemTemplatesFound: number;
    sampleTemplates: any[];
    allItemFields: string[];
    imageFields: string[];
    gameMasterStructure: {
      topLevelKeys: string[];
      hasItemTemplates: boolean;
      hasTemplates: boolean;
      hasTemplate: boolean;
      hasResult: boolean;
      isArray: boolean;
      sampleTemplateKeys?: string[];
    };
  }> {
    try {
      this.logger.log('Fetching Game Master to inspect item templates...');
      const gameMasterJson = await this.fetchGameMaster();
      
      // Analyze Game Master structure
      const topLevelKeys = Object.keys(gameMasterJson || {});
      const hasItemTemplates = !!(gameMasterJson.itemTemplates && Array.isArray(gameMasterJson.itemTemplates));
      const hasTemplates = !!(gameMasterJson.templates && Array.isArray(gameMasterJson.templates));
      const hasTemplate = !!(gameMasterJson.template && Array.isArray(gameMasterJson.template));
      const hasResult = !!(gameMasterJson.result && Array.isArray(gameMasterJson.result));
      const isArray = Array.isArray(gameMasterJson);
      
      // Find templates array - check multiple possible structures
      let templates: any[] = [];
      if (gameMasterJson.itemTemplates && Array.isArray(gameMasterJson.itemTemplates)) {
        templates = gameMasterJson.itemTemplates;
      } else if (gameMasterJson.templates && Array.isArray(gameMasterJson.templates)) {
        templates = gameMasterJson.templates;
      } else if (gameMasterJson.template && Array.isArray(gameMasterJson.template)) {
        templates = gameMasterJson.template;
      } else if (gameMasterJson.result && Array.isArray(gameMasterJson.result)) {
        templates = gameMasterJson.result;
      } else if (Array.isArray(gameMasterJson)) {
        templates = gameMasterJson;
      }
      
      // Get sample template structure
      let sampleTemplateKeys: string[] | undefined;
      if (templates.length > 0) {
        const sample = templates[0];
        const sampleData = sample.data || sample;
        sampleTemplateKeys = Object.keys(sampleData || {});
      }
      
      const itemTemplates: any[] = [];
      const allFields = new Set<string>();
      const imageFields: string[] = [];
      
      // Find all item-related templates
      for (const template of templates) {
        const templateData = template.data || template;
        const templateId = template.templateId || templateData.templateId || '';
        
        // Check if it's an item template
        const isItemTemplate = 
          templateId.includes('ITEM_') || 
          (templateId.startsWith('V') && templateId.includes('ITEM')) ||
          !!templateData.itemSettings ||
          !!templateData.itemId;
        
        if (isItemTemplate) {
          itemTemplates.push({
            templateId,
            data: templateData,
          });
          
          // Collect all field names
          if (templateData.itemSettings) {
            Object.keys(templateData.itemSettings).forEach(key => {
              allFields.add(key);
              // Check for image-related fields
              if (key.toLowerCase().includes('image') || 
                  key.toLowerCase().includes('sprite') || 
                  key.toLowerCase().includes('icon') ||
                  key.toLowerCase().includes('url')) {
                if (!imageFields.includes(key)) {
                  imageFields.push(key);
                }
              }
            });
          }
          
          // Also check top-level fields
          Object.keys(templateData).forEach(key => {
            allFields.add(key);
            if (key.toLowerCase().includes('image') || 
                key.toLowerCase().includes('sprite') || 
                key.toLowerCase().includes('icon') ||
                key.toLowerCase().includes('url')) {
              if (!imageFields.includes(key)) {
                imageFields.push(key);
              }
            }
          });
          
          // Recursively check nested objects for image fields
          const checkNested = (obj: any, prefix: string = '') => {
            if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
              Object.keys(obj).forEach(key => {
                const fullKey = prefix ? `${prefix}.${key}` : key;
                allFields.add(fullKey);
                if (key.toLowerCase().includes('image') || 
                    key.toLowerCase().includes('sprite') || 
                    key.toLowerCase().includes('icon') ||
                    key.toLowerCase().includes('url')) {
                  if (!imageFields.includes(fullKey)) {
                    imageFields.push(fullKey);
                  }
                }
                // Recursively check nested objects
                if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                  checkNested(obj[key], fullKey);
                }
              });
            }
          };
          
          // Check nested objects in templateData
          Object.keys(templateData).forEach(key => {
            if (typeof templateData[key] === 'object' && templateData[key] !== null) {
              checkNested(templateData[key], key);
            }
          });
        }
      }
      
      // Get sample templates (first 5)
      const sampleTemplates = itemTemplates.slice(0, 5).map(t => {
        const data = t.data.itemSettings || t.data;
        return {
          templateId: t.templateId,
          itemId: data.itemId || data.itemId || 'unknown',
          allFields: Object.keys(data),
          imageFields: Object.keys(data).filter(k => 
            k.toLowerCase().includes('image') || 
            k.toLowerCase().includes('sprite') || 
            k.toLowerCase().includes('icon') ||
            k.toLowerCase().includes('url')
          ),
          sampleData: Object.keys(data).reduce((acc, key) => {
            const value = data[key];
            // Only include simple values for readability
            if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
              acc[key] = value;
            } else if (Array.isArray(value) && value.length > 0) {
              acc[key] = `[Array(${value.length})]`;
            } else if (typeof value === 'object' && value !== null) {
              acc[key] = `[Object with keys: ${Object.keys(value).join(', ')}]`;
            }
            return acc;
          }, {} as any),
        };
      });
      
      return {
        totalTemplates: templates.length,
        itemTemplatesFound: itemTemplates.length,
        sampleTemplates,
        allItemFields: Array.from(allFields).sort(),
        imageFields: imageFields.sort(),
        gameMasterStructure: {
          topLevelKeys,
          hasItemTemplates,
          hasTemplates,
          hasTemplate,
          hasResult,
          isArray,
          sampleTemplateKeys,
        },
      };
    } catch (error) {
      this.logger.error('Error inspecting item templates', error);
      throw error;
    }
  }

  async getLatestErrors() {
    // Get the most recent completed ingestion run
    const latestRun = await this.prisma.ingestionRun.findFirst({
      where: {
        status: {
          in: [IngestionRunStatus.SUCCESS, IngestionRunStatus.FAILED],
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    if (!latestRun || !latestRun.errors) {
      return {
        hasErrors: false,
        errors: [],
        runId: latestRun?.id || null,
        summary: latestRun?.summary || null,
      };
    }

    try {
      const errors = JSON.parse(latestRun.errors);
      const errorArray = Array.isArray(errors) ? errors : [errors];
      
      return {
        hasErrors: errorArray.length > 0,
        errors: errorArray,
        runId: latestRun.id,
        summary: latestRun.summary,
        status: latestRun.status,
        startedAt: latestRun.startedAt,
        completedAt: latestRun.completedAt,
      };
    } catch (e) {
      return {
        hasErrors: true,
        errors: [latestRun.errors],
        runId: latestRun.id,
        summary: latestRun.summary,
        status: latestRun.status,
        startedAt: latestRun.startedAt,
        completedAt: latestRun.completedAt,
      };
    }
  }

  async testParsing(): Promise<{
    fetched: boolean;
    parsed: {
      pokemonCount: number;
      movesCount: number;
      typesCount: number;
      samplePokemon?: any;
      samplePokemonIds?: string[];
      pokemonWithDexNumbersCount?: number;
      pokemonWithoutDexNumbers?: string[];
    };
    errors?: string[];
  }> {
    try {
      const gameMasterJson = await this.fetchGameMaster();
      const parsed = await this.parseGameMaster(gameMasterJson);
      
      // Test dex number extraction for pokemon
      const pokemonWithDex: string[] = [];
      const pokemonWithoutDex: string[] = [];
      
      for (const pkmn of parsed.pokemon.slice(0, 50)) { // Test first 50
        const baseId = pkmn.pokemonId.toUpperCase().replace(/^POKEMON_/, '');
        const parts = baseId.split('_');
        let foundDex = false;
        
        for (let i = parts.length; i > 0; i--) {
          const candidate = parts.slice(0, i).join('_');
          if (extractDexNumber(candidate)) {
            pokemonWithDex.push(`${pkmn.pokemonId} -> ${candidate}`);
            foundDex = true;
            break;
          }
        }
        
        if (!foundDex) {
          pokemonWithoutDex.push(pkmn.pokemonId);
        }
      }
      
      return {
        fetched: true,
        parsed: {
          pokemonCount: parsed.pokemon.length,
          movesCount: parsed.moves.length,
          typesCount: parsed.types.length,
          samplePokemon: parsed.pokemon[0] || null,
          samplePokemonIds: parsed.pokemon.slice(0, 10).map(p => p.pokemonId),
          pokemonWithDexNumbersCount: pokemonWithDex.length,
          pokemonWithoutDexNumbers: pokemonWithoutDex.slice(0, 20), // First 20 that failed
        },
        errors: pokemonWithoutDex.length > 20 ? [`${pokemonWithoutDex.length - 20} more pokemon without dex numbers...`] : [],
      };
    } catch (error) {
      return {
        fetched: false,
        parsed: {
          pokemonCount: 0,
          movesCount: 0,
          typesCount: 0,
        },
        errors: [error.message],
      };
    }
  }

  async testGameMasterConnection(): Promise<{
    url: string;
    reachable: boolean;
    status?: number;
    error?: string;
    structure?: string[];
  }> {
    const mirrorUrl = this.config.get<string>('GAME_MASTER_MIRROR_URL');
    if (!mirrorUrl) {
      return {
        url: 'not configured',
        reachable: false,
        error: 'GAME_MASTER_MIRROR_URL not configured',
      };
    }

    try {
      this.logger.log(`Testing connection to ${mirrorUrl}`);
      const response = await axios.get(mirrorUrl, {
        headers: { 'Accept': 'application/json' },
        timeout: 10000,
        validateStatus: () => true, // Don't throw on any status
      });

      const structure = response.data ? Object.keys(response.data).slice(0, 10) : [];

      return {
        url: mirrorUrl,
        reachable: response.status < 400,
        status: response.status,
        structure,
      };
    } catch (error) {
      let errorMessage = 'Unknown error';
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          errorMessage = `Cannot reach server: ${error.message}. Check internet connection and DNS.`;
        } else if (error.code === 'ETIMEDOUT') {
          errorMessage = `Connection timeout: ${error.message}`;
        } else {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      return {
        url: mirrorUrl,
        reachable: false,
        error: errorMessage,
      };
    }
  }
}

interface IngestionStagingResult {
  types: { added: number; updated: number };
  moves: { added: number; updated: number };
  pokemonSpecies: { added: number; updated: number };
  pokemonForms: { added: number; updated: number };
  items: { added: number; updated: number };
  errors: string[];
}

