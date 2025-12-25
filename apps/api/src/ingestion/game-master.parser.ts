/**
 * Game Master JSON Parser
 * 
 * Parses Pokémon GO Game Master JSON format
 * ASSUMPTION: Structure based on pokemongo-dev-contrib format
 * May need updates if structure changes
 */

export interface GameMasterTemplate {
  templateId: string;
  data?: {
    templateId?: string;
    pokemonSettings?: PokemonSettings;
    moveSettings?: MoveSettings;
    typeEffective?: TypeEffective;
    [key: string]: any;
  };
}

export interface PokemonSettings {
  pokemonId: string;
  type1: string;
  type2?: string;
  stats?: {
    baseStamina: number;
    baseAttack: number;
    baseDefense: number;
  };
  quickMoves?: string[];
  cinematicMoves?: string[];
  eliteQuickMove?: string[];
  eliteCinematicMove?: string[];
  form?: string;
  evolutionId?: string;
  parentPokemonId?: string;
  heightStdDev?: number;
  weightStdDev?: number;
  familyId?: string;
  candyToEvolve?: number;
  kmBuddyDistance?: number;
  modelHeight?: number;
  evolutionBranch?: Array<{
    evolution: string;
    evolutionItemRequirement?: string;
    candyCost?: number;
    form?: string;
  }>;
  rarity?: string;
  pokedexHeightM?: number;
  pokedexWeightKg?: number;
  pokemonClass?: string;
  [key: string]: any;
}

export interface MoveSettings {
  movementId: string;
  animationId?: number;
  pokemonType?: string;
  power?: number;
  accuracyChance?: number;
  criticalChance?: number;
  staminaLossScalar?: number;
  trainerLevelMin?: number;
  trainerLevelMax?: number;
  vfxName?: string;
  durationMs?: number;
  damageWindowStartMs?: number;
  damageWindowEndMs?: number;
  energyDelta?: number;
  [key: string]: any;
}

export interface TypeEffective {
  attackType: string;
  attackScalar?: number[];
  [key: string]: any;
}

export interface ItemSettings {
  itemId?: string;
  itemType?: string;
  category?: string;
  dropTrainerLevel?: number;
  dropFreq?: number;
  imageUrl?: string;
  spriteUrl?: string;
  iconUrl?: string;
  [key: string]: any;
}

export interface ParsedGameMaster {
  pokemon: ParsedPokemon[];
  moves: ParsedMove[];
  types: string[];
  items: ParsedItem[];
  timestamp?: string;
}

export interface ItemSpriteMapping {
  [itemId: string]: string; // Maps normalized item ID to sprite filename
}

export interface ParsedItem {
  itemId: string;
  name: string;
  type: string;
  description?: string;
  features?: string; // JSON string
  obtainedFrom?: string;
  spritePath?: string;
}

export interface ParsedPokemon {
  pokemonId: string;
  form?: string;
  type1: string;
  type2?: string;
  baseAttack: number;
  baseDefense: number;
  baseStamina: number;
  quickMoves: string[];
  cinematicMoves: string[];
  eliteQuickMoves: string[];
  eliteCinematicMoves: string[];
  isDefault: boolean;
  familyId?: string;
  evolutionId?: string;
  parentPokemonId?: string;
  rarity?: string;
}

export interface ParsedMove {
  moveId: string;
  name: string;
  type: string;
  power: number;
  energyDelta: number;
  durationMs: number;
  category: 'FAST' | 'CHARGED';
}

export class GameMasterParser {
  // Default CDN base URL for item sprites
  // PokeMiners repository structure supports both:
  // - master/Images/Items/{itemname}_sprite.png (root items)
  // - master/Images/Items/Berries/{berryname}.png (subdirectories)
  // - master/Images/Items/Balls/{ballname}_sprite.png (subdirectories)
  // Example: https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Items/greatball_sprite.png
  // Example: https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Items/Berries/bluk_berry.png
  // To use a custom CDN, set ITEM_SPRITE_CDN_BASE_URL in .env
  private static readonly DEFAULT_ITEM_SPRITE_CDN = 'https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Items';
  
  /**
   * Parse Game Master JSON
   * @param gameMasterJson - The Game Master JSON data
   * @param itemSpriteCdnBaseUrl - Optional base URL for item sprite CDN (defaults to PokeMiners)
   * @param itemSpriteMapping - Optional mapping of item IDs to sprite filenames (from GitHub file list)
   */
  static parse(gameMasterJson: any, itemSpriteCdnBaseUrl?: string, itemSpriteMapping?: ItemSpriteMapping): ParsedGameMaster {
    // Store CDN base URL for use in parseItem
    const cdnBaseUrl = itemSpriteCdnBaseUrl || GameMasterParser.DEFAULT_ITEM_SPRITE_CDN;
    
    // Try different possible structures
    let templates: GameMasterTemplate[] = [];
    let structureFound = '';
    
    if (gameMasterJson.itemTemplates && Array.isArray(gameMasterJson.itemTemplates)) {
      templates = gameMasterJson.itemTemplates;
      structureFound = 'itemTemplates';
    } else if (gameMasterJson.templates && Array.isArray(gameMasterJson.templates)) {
      templates = gameMasterJson.templates;
      structureFound = 'templates';
    } else if (Array.isArray(gameMasterJson)) {
      // If the root is an array, use it directly
      templates = gameMasterJson;
      structureFound = 'root array';
    } else {
      // Try to find any array property that might contain templates
      for (const key of Object.keys(gameMasterJson)) {
        if (Array.isArray(gameMasterJson[key])) {
          templates = gameMasterJson[key];
          structureFound = key;
          break;
        }
      }
    }
    
    // Log structure info for debugging
    if (templates.length === 0) {
      console.warn('No templates found in Game Master JSON. Top-level keys:', Object.keys(gameMasterJson || {}));
      if (gameMasterJson && typeof gameMasterJson === 'object') {
        // Log a sample of the structure
        const sampleKey = Object.keys(gameMasterJson)[0];
        if (sampleKey) {
          console.warn(`Sample structure for '${sampleKey}':`, 
            typeof gameMasterJson[sampleKey] === 'object' 
              ? Object.keys(gameMasterJson[sampleKey] || {}).slice(0, 5)
              : typeof gameMasterJson[sampleKey]);
        }
      }
    } else {
      console.log(`Found ${templates.length} templates using structure: ${structureFound}`);
      // Log a sample template structure
      if (templates.length > 0) {
        const sample = templates[0];
        console.log('Sample template keys:', Object.keys(sample || {}));
        if (sample?.data) {
          console.log('Sample template.data keys:', Object.keys(sample.data));
        }
      }
    }
    
    const pokemon: ParsedPokemon[] = [];
    const moves: ParsedMove[] = [];
    const items: ParsedItem[] = [];
    const types = new Set<string>();
    
    let pokemonTemplateCount = 0;
    let moveTemplateCount = 0;
    let itemTemplateCount = 0;
    let skippedPokemonCount = 0;
    
    // Log sample template structure for debugging
    if (templates.length > 0) {
      const sampleTemplate = templates[0];
      const sampleKeys = Object.keys(sampleTemplate || {});
      console.log('Sample template structure:', {
        hasData: !!(sampleTemplate as any).data,
        topLevelKeys: sampleKeys,
        dataKeys: (sampleTemplate as any).data ? Object.keys((sampleTemplate as any).data || {}) : [],
        templateId: (sampleTemplate as any).templateId,
      });
      
      // Find a pokemon template to inspect
      let sampleLogged = false;
      for (const t of templates.slice(0, 200)) {
        const td = (t as any).data || t;
        if (td?.pokemonSettings || (t as any).templateId?.includes('POKEMON')) {
          const pokemonSettings = td?.pokemonSettings || td;
          if (pokemonSettings && pokemonSettings.pokemonId && !sampleLogged) {
            console.log('Found pokemon template sample:', {
              templateId: (t as any).templateId,
              pokemonId: pokemonSettings.pokemonId,
              hasType1: !!pokemonSettings.type1,
              hasType: !!pokemonSettings.type,
              hasPokemonType: !!(pokemonSettings as any).pokemonType,
              pokemonSettingsKeys: Object.keys(pokemonSettings || {}),
              type1Value: pokemonSettings.type1,
              typeValue: (pokemonSettings as any).type,
              pokemonTypeValue: (pokemonSettings as any).pokemonType,
            });
            sampleLogged = true;
          }
        }
      }
    }
    
    for (const template of templates) {
      // Handle different template structures
      // template.data contains the actual settings, or template itself might be the data
      const templateData: any = (template as any).data || template;
      
      if (!templateData) continue;
      
      // Check templateId to identify type - some Game Master formats use templateId
      const templateId = (template as any).templateId || templateData.templateId || '';
      const isPokemonTemplate = templateId.includes('POKEMON_') || templateId.startsWith('V') && templateId.includes('POKEMON');
      const isMoveTemplate = templateId.includes('MOVE_') || templateId.startsWith('V') && templateId.includes('MOVE');
      const isItemTemplate = templateId.includes('ITEM_') || templateId.startsWith('V') && templateId.includes('ITEM') || templateData.itemSettings;
      
      // Parse Pokémon - check multiple possible locations
      if (templateData.pokemonSettings || isPokemonTemplate) {
        pokemonTemplateCount++;
        const pokemonSettings = templateData.pokemonSettings || (isPokemonTemplate ? templateData : null);
        if (pokemonSettings) {
          const parsed = this.parsePokemon(pokemonSettings);
          if (parsed) {
            pokemon.push(parsed);
            types.add(parsed.type1);
            if (parsed.type2) types.add(parsed.type2);
          } else {
            skippedPokemonCount++;
            if (skippedPokemonCount <= 5) {
              console.warn(`Skipped pokemon template: ${templateId || 'unknown'}, pokemonId: ${pokemonSettings.pokemonId || 'missing'}`);
            }
          }
        }
      }
      
      // Parse Moves - check multiple possible locations
      if (templateData.moveSettings || isMoveTemplate) {
        moveTemplateCount++;
        const moveSettings = templateData.moveSettings || (isMoveTemplate ? templateData : null);
        if (moveSettings) {
          const parsed = this.parseMove(moveSettings);
          if (parsed) {
            moves.push(parsed);
            types.add(parsed.type);
          }
        }
      }
      
      // Parse Items - check multiple possible locations
      if (templateData.itemSettings || isItemTemplate) {
        itemTemplateCount++;
        const itemSettings = templateData.itemSettings || (isItemTemplate ? templateData : null);
        if (itemSettings) {
          try {
            const parsed = this.parseItem(itemSettings, templateId, cdnBaseUrl, itemSpriteMapping);
            if (parsed) {
              items.push(parsed);
            }
          } catch (error) {
            // Log but don't fail entire ingestion if one item fails
            console.warn(`Failed to parse item template ${templateId}:`, error);
          }
        }
      }
    }
    
    console.log(`Parser results: ${pokemonTemplateCount} pokemon templates found, ${pokemon.length} parsed successfully, ${skippedPokemonCount} skipped`);
    console.log(`Parser results: ${moveTemplateCount} move templates found, ${moves.length} parsed successfully`);
    console.log(`Parser results: ${itemTemplateCount} item templates found, ${items.length} parsed successfully`);
    
    return {
      pokemon,
      moves,
      items,
      types: Array.from(types).sort(),
      timestamp: gameMasterJson.timestampMs || gameMasterJson.timestamp || new Date().toISOString(),
    };
  }
  
  private static parsePokemon(settings: PokemonSettings): ParsedPokemon | null {
    if (!settings.pokemonId) {
      console.warn('Skipping pokemon: missing pokemonId');
      return null;
    }
    if (!settings.stats) {
      console.warn(`Skipping pokemon ${settings.pokemonId}: missing stats`);
      return null;
    }
    
    // The Game Master might use different field names for types
    // Try type1, type, pokemonType, or check if it's in a different structure
    let type1 = settings.type1;
    let type2 = settings.type2;
    
    // If type1 is missing, try alternative field names and structures
    if (!type1) {
      // Check if type is stored as a single field
      type1 = (settings as any).type;
      // Check if it's stored as pokemonType
      if (!type1) {
        type1 = (settings as any).pokemonType;
      }
      // Check if types are in an array
      if (!type1 && (settings as any).types) {
        const types = (settings as any).types;
        if (Array.isArray(types) && types.length > 0) {
          type1 = types[0];
          type2 = types[1];
        }
      }
      // Check if type is in stats or another nested object
      if (!type1 && settings.stats && (settings.stats as any).type) {
        type1 = (settings.stats as any).type;
      }
      // Check if it's stored as type1Enum or type2Enum (enum values)
      if (!type1) {
        const type1Enum = (settings as any).type1Enum || (settings as any).typeEnum;
        if (type1Enum) {
          // Convert enum to string (e.g., POKEMON_TYPE_NORMAL -> NORMAL)
          type1 = String(type1Enum).replace(/^POKEMON_TYPE_?/i, '').replace(/^TYPE_?/i, '');
        }
        const type2Enum = (settings as any).type2Enum;
        if (type2Enum) {
          type2 = String(type2Enum).replace(/^POKEMON_TYPE_?/i, '').replace(/^TYPE_?/i, '');
        }
      }
    }
    
    if (!type1) {
      // Only log first few to avoid spam, but include more detail
      const availableKeys = Object.keys(settings || {});
      const sampleValues: any = {};
      // Sample a few key fields to see what's there
      ['type', 'pokemonType', 'type1Enum', 'typeEnum', 'types'].forEach(key => {
        if ((settings as any)[key] !== undefined) {
          sampleValues[key] = (settings as any)[key];
        }
      });
      console.warn(`Skipping pokemon ${settings.pokemonId}: missing type1. Sample fields:`, JSON.stringify(sampleValues));
      return null;
    }
    
    const form = settings.form || 'NORMAL';
    const isDefault = !settings.form || settings.form === 'NORMAL';
    
    return {
      pokemonId: settings.pokemonId,
      form: form,
      type1: this.normalizeType(type1),
      type2: type2 ? this.normalizeType(type2) : undefined,
      baseAttack: settings.stats.baseAttack || 0,
      baseDefense: settings.stats.baseDefense || 0,
      baseStamina: settings.stats.baseStamina || 0,
      quickMoves: settings.quickMoves || [],
      cinematicMoves: settings.cinematicMoves || [],
      eliteQuickMoves: settings.eliteQuickMove || [],
      eliteCinematicMoves: settings.eliteCinematicMove || [],
      isDefault,
      familyId: settings.familyId,
      evolutionId: settings.evolutionId,
      parentPokemonId: settings.parentPokemonId,
      rarity: settings.rarity,
    };
  }
  
  private static parseMove(settings: MoveSettings): ParsedMove | null {
    if (!settings.movementId) {
      return null;
    }
    
    // Determine category based on energyDelta
    // Negative = fast move (generates energy)
    // Positive = charged move (costs energy)
    const energyDelta = settings.energyDelta || 0;
    const category = energyDelta < 0 ? 'FAST' : 'CHARGED';
    
    return {
      moveId: settings.movementId,
      name: this.normalizeMoveName(settings.movementId),
      type: this.normalizeType(settings.pokemonType || 'NORMAL'),
      power: settings.power || 0,
      energyDelta: Math.abs(energyDelta), // Store as positive for our schema
      durationMs: settings.durationMs || 1000,
      category,
    };
  }
  
  private static normalizeType(type: string | undefined | null): string {
    // Convert to uppercase and handle variations
    if (!type) {
      return 'NORMAL'; // Default type if missing
    }
    
    let normalized = type.toUpperCase();
    
    // Remove common prefixes
    normalized = normalized.replace(/^POKEMON_TYPE_?/i, '');
    normalized = normalized.replace(/^POKEMONTYPE/i, '');
    normalized = normalized.replace(/^TYPE_?/i, '');
    
    // Remove any non-alphabetic characters
    normalized = normalized.replace(/[^A-Z]/g, '');
    
    return normalized || 'NORMAL';
  }
  
  private static normalizeMoveName(moveId: string): string {
    // Convert move ID to readable name
    // e.g., "V0001_MOVE_THUNDER_SHOCK" -> "Thunder Shock"
    return moveId
      .replace(/^V\d+_MOVE_/, '')
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  }
  
  private static parseItem(settings: ItemSettings, templateId: string, cdnBaseUrl?: string, itemSpriteMapping?: ItemSpriteMapping): ParsedItem | null {
    // Extract item ID from templateId or settings
    let originalItemId: string | undefined = settings.itemId;
    
    // If itemId is not a string, try to get it from templateId
    if (!originalItemId || typeof originalItemId !== 'string') {
      originalItemId = templateId;
    }
    
    // Ensure itemId is a string and not empty
    if (!originalItemId || typeof originalItemId !== 'string') {
      return null;
    }
    
    // Store original itemId for sprite URL (CDN needs full ID with ITEM_ prefix)
    const originalItemIdForSprite = String(originalItemId).replace(/^V\d+_ITEM_/, '');
    
    // Normalize item ID - remove version prefix and ITEM_ prefix for storage
    const itemId = String(originalItemId).replace(/^V\d+_ITEM_/, '').replace(/^ITEM_/, '');
    
    // Extract item name from normalized ID
    const name = this.normalizeItemName(itemId);
    
    // Determine item type from category or itemId
    const category = String(settings.category || settings.itemType || '');
    const itemType = this.mapItemType(category, itemId);
    
    // Extract description if available
    const description = settings.description || settings.itemEffect || null;
    const descriptionStr = description ? String(description) : null;
    
    // Build features object
    const features: any = {};
    if (settings.dropTrainerLevel !== undefined) {
      features.dropTrainerLevel = settings.dropTrainerLevel;
    }
    if (settings.dropFreq !== undefined) {
      features.dropFreq = settings.dropFreq;
    }
    // Add other relevant features
    if (settings.stardustToEvolve !== undefined) {
      features.stardustToEvolve = settings.stardustToEvolve;
    }
    if (settings.candyToEvolve !== undefined) {
      features.candyToEvolve = settings.candyToEvolve;
    }
    
    const featuresJson = Object.keys(features).length > 0 ? JSON.stringify(features) : null;
    
    // Determine how item is obtained
    const obtainedFrom = this.determineObtainedFrom(itemType, settings);
    
    // Try to extract sprite/image URL from settings
    let spritePath: string | null = null;
    
    // Check for image URLs in settings
    if (settings.imageUrl && typeof settings.imageUrl === 'string') {
      spritePath = settings.imageUrl;
    } else if (settings.spriteUrl && typeof settings.spriteUrl === 'string') {
      spritePath = settings.spriteUrl;
    } else if (settings.iconUrl && typeof settings.iconUrl === 'string') {
      spritePath = settings.iconUrl;
    } else {
      // Fallback: construct URL from item ID using CDN
      // Use original itemId (with ITEM_ prefix) for CDN URL construction
      // Defaults to PokeMiners CDN which hosts Pokemon GO item sprites extracted from the game
      spritePath = this.constructItemSpriteUrl(originalItemIdForSprite, itemType, cdnBaseUrl, itemSpriteMapping);
    }
    
    return {
      itemId,
      name,
      type: itemType,
      description: descriptionStr,
      features: featuresJson,
      obtainedFrom,
      spritePath,
    };
  }
  
  private static normalizeItemName(itemId: string): string {
    // Convert item ID to readable name
    // e.g., "ITEM_POKE_BALL" -> "Poke Ball"
    return itemId
      .replace(/^ITEM_/, '')
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  }
  
  private static mapItemType(category: string, itemId: string): string {
    // Map item category/ID to our ItemType enum
    const upperCategory = category.toUpperCase();
    const upperId = itemId.toUpperCase();
    
    // Check for specific item types
    if (upperId.includes('POKE_BALL') || upperId.includes('POKEBALL') || upperId.includes('BALL')) {
      return 'POKEBALL';
    }
    if (upperId.includes('BERRY') || upperCategory.includes('BERRY')) {
      return 'BERRY';
    }
    if (upperId.includes('POTION') || upperCategory.includes('POTION')) {
      return 'POTION';
    }
    if (upperId.includes('REVIVE') || upperCategory.includes('REVIVE')) {
      return 'REVIVE';
    }
    if (upperId.includes('INCENSE') || upperCategory.includes('INCENSE')) {
      return 'INCENSE';
    }
    if (upperId.includes('LURE') || upperCategory.includes('LURE')) {
      return 'LURE_MODULE';
    }
    if (upperId.includes('EGG') && !upperId.includes('LUCKY')) {
      return 'EGG';
    }
    if (upperId.includes('INCUBATOR')) {
      return 'INCUBATOR';
    }
    if (upperId.includes('STAR_PIECE') || upperId.includes('STARPIECE')) {
      return 'STAR_PIECE';
    }
    if (upperId.includes('LUCKY_EGG') || upperId.includes('LUCKYEGG')) {
      return 'LUCKY_EGG';
    }
    if (upperId.includes('TM_') || upperId.includes('FAST_TM') || upperId.includes('CHARGE_TM')) {
      return 'TMS';
    }
    if (upperId.includes('RARE_CANDY') || upperId.includes('RARECANDY')) {
      return 'RARE_CANDY';
    }
    if (upperId.includes('STARDUST')) {
      return 'STARDUST';
    }
    
    return 'OTHER';
  }
  
  private static determineObtainedFrom(itemType: string, settings: ItemSettings): string {
    // Determine how the item is obtained based on type and settings
    const sources: string[] = [];
    
    if (settings.dropTrainerLevel !== undefined && settings.dropTrainerLevel > 0) {
      sources.push(`PokeStops (Level ${settings.dropTrainerLevel}+)`);
    } else if (itemType === 'POKEBALL' || itemType === 'POTION' || itemType === 'REVIVE') {
      sources.push('PokeStops');
    }
    
    // Most items can be obtained from shop
    if (itemType !== 'STARDUST') {
      sources.push('Shop');
    }
    
    // Special items
    if (itemType === 'EGG') {
      sources.push('PokeStops');
      sources.push('Gifts');
    }
    
    if (itemType === 'BERRY') {
      sources.push('PokeStops');
      sources.push('Gym Battles');
    }
    
    return sources.length > 0 ? sources.join(', ') : 'Unknown';
  }
  
  /**
   * Construct sprite URL for an item based on item ID
   * 
   * Uses itemSpriteMapping if provided (from GitHub file list), otherwise tries to construct
   * the filename based on common naming patterns.
   * 
   * Default CDN: https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Items
   * 
   * To use a custom CDN, set ITEM_SPRITE_CDN_BASE_URL in your .env file:
   * ITEM_SPRITE_CDN_BASE_URL=https://your-cdn.com/items
   */
  private static constructItemSpriteUrl(itemId: string, itemType: string, cdnBaseUrl?: string, itemSpriteMapping?: ItemSpriteMapping): string | null {
    // Use provided CDN base URL or default
    const baseUrl = cdnBaseUrl || GameMasterParser.DEFAULT_ITEM_SPRITE_CDN;
    
    // If no CDN is configured, return null (items will work without sprites)
    if (!baseUrl) {
      return null;
    }
    
    // Normalize item ID for lookup
    let normalizedId = itemId.toUpperCase().replace(/[^A-Z0-9_]/g, '');
    if (!normalizedId.startsWith('ITEM_')) {
      normalizedId = `ITEM_${normalizedId}`;
    }
    
    let fileName: string | null = null;
    
    // First, try to find exact match in mapping
    if (itemSpriteMapping && itemSpriteMapping[normalizedId]) {
      fileName = itemSpriteMapping[normalizedId];
    } else if (itemSpriteMapping) {
      // Try different naming patterns and variations
      const patterns = this.generateItemFileNamePatterns(normalizedId);
      
      // Also try variations of the item ID
      const idVariations = this.generateItemIdVariations(normalizedId);
      const allPatterns = [...patterns, ...idVariations];
      
      // Try to find a match in the mapping
      for (const pattern of allPatterns) {
        // Try exact key match
        if (itemSpriteMapping[pattern]) {
          fileName = itemSpriteMapping[pattern];
          break;
        }
        
        // Try case-insensitive key match
        const matchingKey = Object.keys(itemSpriteMapping).find(k => 
          k.toUpperCase() === pattern.toUpperCase()
        );
        if (matchingKey) {
          fileName = itemSpriteMapping[matchingKey];
          break;
        }
      }
      
      // If still no match, try fuzzy matching on filenames (handle subdirectories)
      if (!fileName) {
        const itemNameBase = normalizedId.replace(/^ITEM_/, '').toLowerCase().replace(/_/g, '');
        const matchingFile = Object.values(itemSpriteMapping).find((f: string) => {
          // Extract just the filename from path (handle subdirectories like "Berries/bluk_berry.png")
          const pathParts = f.split('/');
          const justFilename = pathParts[pathParts.length - 1];
          const fileBase = justFilename.toLowerCase().replace(/\.png$/i, '').replace(/_sprite$/i, '').replace(/[^a-z0-9]/g, '');
          return fileBase === itemNameBase || fileBase.includes(itemNameBase) || itemNameBase.includes(fileBase);
        });
        if (matchingFile) {
          fileName = matchingFile as string;
        }
      }
      
      // If still no match, try constructing paths based on item type and common subdirectories
      if (!fileName) {
        fileName = this.constructFallbackSpritePath(normalizedId, itemType);
      }
    } else {
      // No mapping available, try fallback construction
      fileName = this.constructFallbackSpritePath(normalizedId, itemType) || this.generateItemFileNamePatterns(normalizedId)[0];
    }
    
    if (!fileName) {
      return null;
    }
    
    // Construct the URL
    // fileName may include subdirectory path (e.g., "Berries/bluk_berry.png")
    // or just be a filename (e.g., "greatball_sprite.png")
    return `${baseUrl}/${fileName}`;
  }
  
  /**
   * Generate possible filename patterns for an item ID
   * Based on actual PokeMiners naming conventions
   * 
   * Actual patterns:
   * - ITEM_GOLDEN_RAZZ_BERRY -> berry_golden_razz.png
   * - ITEM_RAZZ_BERRY -> berry_razz.png
   * - ITEM_POKE_BALL -> item_pokeball.png
   * - ITEM_GREAT_BALL -> item_greatball.png
   * - ITEM_POTION -> item_potion.png
   * - ITEM_SUPER_POTION -> item_super_potion.png
   */
  private static generateItemFileNamePatterns(itemId: string): string[] {
    const patterns: string[] = [];
    
    // Remove ITEM_ prefix
    let baseId = itemId;
    if (baseId.startsWith('ITEM_')) {
      baseId = baseId.substring(5);
    }
    
    const baseIdLower = baseId.toLowerCase();
    
    // Pattern 1: Handle berries (ITEM_GOLDEN_RAZZ_BERRY -> berry_golden_razz.png)
    if (baseId.endsWith('_BERRY')) {
      const berryType = baseId.substring(0, baseId.length - 6); // Remove _BERRY
      patterns.push(`berry_${berryType.toLowerCase().replace(/_/g, '_')}.png`);
    }
    
    // Pattern 2: Handle items with item_ prefix
    // ITEM_POKE_BALL -> item_pokeball.png (remove underscores for compound words)
    // ITEM_POTION -> item_potion.png
    // ITEM_SUPER_POTION -> item_super_potion.png
    
    const compoundEndings = ['_BALL', '_POTION', '_REVIVE', '_INCENSE', '_LURE', '_EGG', '_TICKET', '_CANDY', '_STARDUST', '_INCUBATOR'];
    let isCompound = false;
    for (const ending of compoundEndings) {
      if (baseId.endsWith(ending)) {
        const before = baseId.substring(0, baseId.length - ending.length);
        const endingLower = ending.toLowerCase().substring(1); // Remove leading _
        if (before) {
          // pokeball, greatball, etc. (remove underscore between parts)
          patterns.push(`item_${before.toLowerCase().replace(/_/g, '')}${endingLower}.png`);
        }
        isCompound = true;
        break;
      }
    }
    
    if (!isCompound) {
      // Not a compound word, use as-is with item_ prefix
      patterns.push(`item_${baseIdLower.replace(/_/g, '_')}.png`);
    }
    
    // Pattern 3: Legacy patterns (for backwards compatibility)
    patterns.push(`${baseIdLower.replace(/_/g, '')}_sprite.png`);
    patterns.push(`${baseIdLower.replace(/_/g, '')}.png`);
    
    return patterns;
  }
  
  /**
   * Generate variations of item ID for mapping lookup
   * Creates different formats that might be used as keys in the mapping
   */
  private static generateItemIdVariations(itemId: string): string[] {
    const variations: string[] = [itemId];
    
    // Remove ITEM_ prefix variations
    if (itemId.startsWith('ITEM_')) {
      variations.push(itemId.substring(5)); // Without ITEM_ prefix
    } else {
      variations.push(`ITEM_${itemId}`); // With ITEM_ prefix
    }
    
    return variations;
  }
  
  /**
   * Construct fallback sprite path based on item type and actual PokeMiners naming
   * This is used when the mapping doesn't find a match
   */
  private static constructFallbackSpritePath(itemId: string, itemType: string): string | null {
    // Remove ITEM_ prefix
    let baseId = itemId;
    if (baseId.startsWith('ITEM_')) {
      baseId = baseId.substring(5);
    }
    
    const baseIdLower = baseId.toLowerCase();
    
    // Pattern 1: Handle berries (ITEM_GOLDEN_RAZZ_BERRY -> berry_golden_razz.png)
    // Special cases: BLUK_BERRY might not have a sprite, but others do
    if (baseId.endsWith('_BERRY') || itemType === 'BERRY') {
      const berryType = baseId.endsWith('_BERRY') 
        ? baseId.substring(0, baseId.length - 6) // Remove _BERRY
        : baseId;
      // Convert to lowercase and handle special cases
      const berryName = berryType.toLowerCase().replace(/_/g, '_');
      return `berry_${berryName}.png`;
    }
    
    // Pattern 2: Handle items with item_ prefix
    // ITEM_POKE_BALL -> item_pokeball.png
    // ITEM_POTION -> item_potion.png
    // ITEM_SUPER_POTION -> item_super_potion.png
    
    const compoundEndings = ['_BALL', '_POTION', '_REVIVE', '_INCENSE', '_LURE', '_EGG', '_TICKET', '_CANDY', '_STARDUST', '_INCUBATOR'];
    for (const ending of compoundEndings) {
      if (baseId.endsWith(ending)) {
        const before = baseId.substring(0, baseId.length - ending.length);
        const endingLower = ending.toLowerCase().substring(1); // Remove leading _
        if (before) {
          // pokeball, greatball, etc. (remove underscore between parts)
          return `item_${before.toLowerCase().replace(/_/g, '')}${endingLower}.png`;
        }
      }
    }
    
    // Pattern 3: Simple items (ITEM_POTION -> item_potion.png)
    return `item_${baseIdLower.replace(/_/g, '_')}.png`;
  }
}

