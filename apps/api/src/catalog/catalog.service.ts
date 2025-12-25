import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  /**
   * Normalize type name by removing common prefixes and converting to standard format
   */
  private normalizeTypeName(typeName: string): string {
    if (!typeName) return 'NORMAL';
    
    let normalized = String(typeName).toUpperCase().trim();
    
    // Remove common prefixes (order matters - try longer/more specific prefixes first)
    // POKEMON_TYPE_GRASS -> GRASS
    normalized = normalized.replace(/^POKEMON_TYPE_/i, '');
    // POKEMONTYPE_GRASS -> GRASS  
    normalized = normalized.replace(/^POKEMONTYPE_/i, '');
    // POKEMONTYPEGRASS -> GRASS (no underscore)
    normalized = normalized.replace(/^POKEMONTYPE/i, '');
    // POKEMON_TYPEGRASS -> GRASS (no underscore after TYPE)
    normalized = normalized.replace(/^POKEMON_TYPE/i, '');
    // TYPE_GRASS -> GRASS
    normalized = normalized.replace(/^TYPE_/i, '');
    // TYPEGRASS -> GRASS (no underscore)
    normalized = normalized.replace(/^TYPE/i, '');
    
    // Remove any remaining non-alphabetic characters (underscores, dashes, spaces, etc.)
    normalized = normalized.replace(/[^A-Z]/g, '');
    
    return normalized || 'NORMAL';
  }

  /**
   * Generate all possible variations of a type name for searching
   */
  private getTypeNameVariations(typeName: string): string[] {
    const normalized = this.normalizeTypeName(typeName);
    const variations = [
      normalized,
      `POKEMON_TYPE_${normalized}`,
      `POKEMONTYPE_${normalized}`,
      `POKEMONTYPE${normalized}`, // No underscore variant
      `TYPE_${normalized}`,
      `POKEMON_TYPE${normalized}`, // No underscore variant
      `TYPE${normalized}`, // No underscore variant
      normalized.toLowerCase(),
      normalized.charAt(0) + normalized.slice(1).toLowerCase(),
      // Also include the original input if it's different
      typeName,
      typeName.toUpperCase(),
      typeName.toLowerCase(),
    ];
    // Remove duplicates
    return [...new Set(variations)];
  }

  async getPokemonSpecies(skip = 0, take = 50) {
    return this.prisma.pokemonSpecies.findMany({
      skip,
      take,
      include: {
        primaryType: true,
        secondaryType: true,
        region: true,
        forms: {
          include: {
            moves: {
              include: {
                move: {
                  include: {
                    type: true,
                  },
                },
              },
            },
            assets: {
              where: {
                purpose: 'THUMBNAIL',
              },
              include: {
                asset: true,
              },
              take: 1,
            },
          },
        },
      },
      orderBy: {
        dexNumber: 'asc',
      },
    });
  }

  async getPokemonSpeciesById(id: string) {
    const pokemon = await this.prisma.pokemonSpecies.findUnique({
      where: { id },
      include: {
        primaryType: true,
        secondaryType: true,
        region: true,
        forms: {
          include: {
            moves: {
              include: {
                move: {
                  include: {
                    type: true,
                  },
                },
              },
            },
            assets: {
              include: {
                asset: true,
              },
            },
          },
        },
      },
    });

    if (!pokemon) {
      return null;
    }

    // Build evolution chain - find pokemon in the same evolution line
    // Strategy: Look for pokemon with dex numbers close by (typically evolutions are sequential)
    // Also check for pokemon that might be related (1-2 dex numbers away)
    const evolutionChain = await this.buildEvolutionChain(pokemon.dexNumber);

    return {
      ...pokemon,
      evolutionChain,
    };
  }

  private async buildEvolutionChain(currentDexNumber: number) {
    // Find the current pokemon to get its familyId
    const currentPokemon = await this.prisma.pokemonSpecies.findUnique({
      where: { dexNumber: currentDexNumber },
      select: { id: true, familyId: true, parentPokemonId: true },
    });

    if (!currentPokemon) {
      return [];
    }

    // Get all pokemon in the same evolution family
    // Use familyId if available, otherwise try to find related pokemon
    let familyMembers;
    
    if (currentPokemon.familyId) {
      // Get all pokemon in the same family
      familyMembers = await this.prisma.pokemonSpecies.findMany({
        where: { familyId: currentPokemon.familyId },
        include: {
          primaryType: true,
          forms: {
            where: { isDefault: true },
            include: {
              assets: {
                where: { purpose: 'THUMBNAIL' },
                include: { asset: true },
                take: 1,
              },
            },
            take: 1,
          },
        },
      });
    } else {
      // Fallback: try to find related pokemon by traversing parent/child relationships
      // First, find all ancestors and descendants
      const relatedIds = new Set<string>([currentPokemon.id]);
      
      // Go up to find all ancestors
      let current = currentPokemon;
      while (current.parentPokemonId) {
        relatedIds.add(current.parentPokemonId);
        const parent = await this.prisma.pokemonSpecies.findUnique({
          where: { id: current.parentPokemonId },
          select: { id: true, familyId: true, parentPokemonId: true },
        });
        if (parent) {
          current = parent;
        } else {
          break;
        }
      }
      
      // Go down to find all descendants
      const addDescendants = async (parentId: string) => {
        const children = await this.prisma.pokemonSpecies.findMany({
          where: { parentPokemonId: parentId },
          select: { id: true },
        });
        for (const child of children) {
          if (!relatedIds.has(child.id)) {
            relatedIds.add(child.id);
            await addDescendants(child.id);
          }
        }
      };
      await addDescendants(currentPokemon.id);
      
      // Get all related pokemon with full data
      familyMembers = await this.prisma.pokemonSpecies.findMany({
        where: { id: { in: Array.from(relatedIds) } },
        include: {
          primaryType: true,
          forms: {
            where: { isDefault: true },
            include: {
              assets: {
                where: { purpose: 'THUMBNAIL' },
                include: { asset: true },
                take: 1,
              },
            },
            take: 1,
          },
        },
      });
    }

    if (!familyMembers || familyMembers.length === 0) {
      return [];
    }

    // Build the evolution chain by following parent-child relationships
    // Start from the base form (pokemon with no parent)
    const orderedChain: any[] = [];
    const processed = new Set<string>();
    
    // Find the base pokemon (no parent)
    const base = familyMembers.find(p => !p.parentPokemonId);
    
    if (base) {
      // Recursively build chain starting from base
      const addToChain = (pokemon: any) => {
        if (processed.has(pokemon.id)) {
          return; // Avoid cycles
        }
        
        orderedChain.push(pokemon);
        processed.add(pokemon.id);
        
        // Find and add all children (sorted by dexNumber for consistent ordering of branches)
        const children = familyMembers
          .filter(p => p.parentPokemonId === pokemon.id && !processed.has(p.id))
          .sort((a, b) => a.dexNumber - b.dexNumber);
        
        for (const child of children) {
          addToChain(child);
        }
      };
      
      addToChain(base);
    } else {
      // If no base found (all have parents), fall back to sorting by dexNumber
      // This shouldn't happen in normal cases, but handle it gracefully
      orderedChain.push(...familyMembers.sort((a, b) => a.dexNumber - b.dexNumber));
    }

    return orderedChain.map((p) => ({
      id: p.id,
      dexNumber: p.dexNumber,
      name: p.name,
      primaryType: p.primaryType,
      spriteUrl: p.forms[0]?.assets[0]?.asset?.path || null,
    }));
  }

  async getPokemonFormById(id: string) {
    return this.prisma.pokemonForm.findUnique({
      where: { id },
      include: {
        species: {
          include: {
            primaryType: true,
            secondaryType: true,
          },
        },
        moves: {
          include: {
            move: {
              include: {
                type: true,
              },
            },
          },
        },
        assets: {
          include: {
            asset: true,
          },
        },
      },
    });
  }

  async getMoves(skip = 0, take = 100) {
    return this.prisma.move.findMany({
      skip,
      take,
      include: {
        type: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async getMovesByType(typeIdOrName: string) {
    if (!typeIdOrName) {
      return [];
    }

    // Use the same logic as getTypeById to find the type
    const type = await this.getTypeById(typeIdOrName);

    if (!type) {
      return [];
    }

    // Find all moves that have this type
    const moves = await this.prisma.move.findMany({
      where: {
        typeId: type.id,
      },
      include: {
        type: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return moves;
  }

  async getTypes() {
    return this.prisma.type.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  async getTypeById(id: string) {
    if (!id) return null;

    // Try to find by ID first
    const byId = await this.prisma.type.findUnique({
      where: { id },
    });
    if (byId) {
      return byId;
    }

    // Get all types once
    const allTypes = await this.prisma.type.findMany();
    if (allTypes.length === 0) {
      return null;
    }

    // Normalize the input
    const normalizedInput = this.normalizeTypeName(id);
    const inputLower = id.toLowerCase().trim();

    // Strategy 1: Try exact match (case-insensitive)
    const exactMatch = allTypes.find(
      t => t.name.toLowerCase() === inputLower
    );
    if (exactMatch) {
      return exactMatch;
    }

    // Strategy 2: Try normalized match (most reliable)
    // This handles cases like "POKEMONTYPEGRASS" -> "GRASS" matching "GRASS" in DB
    for (const type of allTypes) {
      const normalizedType = this.normalizeTypeName(type.name);
      if (normalizedType === normalizedInput) {
        // Only skip if both are "NORMAL" (to avoid false matches)
        if (normalizedInput !== 'NORMAL' || normalizedType === 'NORMAL') {
          return type;
        }
      }
    }

    // Strategy 3: Try case-insensitive contains match
    // Sometimes the type name might be embedded in a longer string
    if (normalizedInput !== 'NORMAL') {
      for (const type of allTypes) {
        const normalizedType = this.normalizeTypeName(type.name);
        const typeNameUpper = type.name.toUpperCase();
        // Check if the normalized input is contained in the type name or vice versa
        if (typeNameUpper.includes(normalizedInput) || normalizedInput.includes(normalizedType)) {
          if (normalizedType !== 'NORMAL') {
            return type;
          }
        }
      }
    }

    // Strategy 4: Try variations as fallback
    const variations = this.getTypeNameVariations(id);
    for (const variation of variations) {
      const match = allTypes.find(
        t => t.name.toLowerCase() === variation.toLowerCase()
      );
      if (match) {
        return match;
      }
    }

    return null;
  }

  async getRegions() {
    return this.prisma.region.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  async getRegionById(idOrName: string) {
    if (!idOrName) return null;

    // Handle special case: "none" or "null" means no region
    const normalized = idOrName.toLowerCase().trim();
    if (normalized === 'none' || normalized === 'null') {
      return { id: '__none__', name: 'None' } as any;
    }

    // Try to find by ID first
    const byId = await this.prisma.region.findUnique({
      where: { id: idOrName },
    });
    if (byId) {
      return byId;
    }

    // Try to find by name (case-insensitive)
    const byName = await this.prisma.region.findFirst({
      where: {
        name: {
          equals: idOrName,
          mode: 'insensitive',
        },
      },
    });
    if (byName) {
      return byName;
    }

    return null;
  }

  async getPokemonByRegion(regionIdOrName: string) {
    if (!regionIdOrName) {
      return [];
    }

    // Use the same logic as getRegionById to find the region
    const region = await this.getRegionById(regionIdOrName);

    if (!region) {
      // Region not found - return empty array
      return [];
    }

    // Handle special case: Pokemon with no region
    const whereClause = region.id === '__none__'
      ? { regionId: null }
      : { regionId: region.id };

    // Find all PokemonSpecies that have this region (or no region if __none__)
    const pokemonSpecies = await this.prisma.pokemonSpecies.findMany({
      where: whereClause,
      include: {
        primaryType: true,
        secondaryType: true,
        region: true,
        forms: {
          where: {
            isDefault: true,
          },
          include: {
            assets: {
              where: {
                purpose: 'THUMBNAIL',
              },
              include: {
                asset: true,
              },
              take: 1,
            },
          },
          take: 1,
        },
      },
      orderBy: {
        dexNumber: 'asc',
      },
    });

    return pokemonSpecies.map((p) => {
      const defaultForm = p.forms?.[0];
      const spriteAsset = defaultForm?.assets?.[0]?.asset;
      const spriteUrl = spriteAsset?.path || null;

      return {
        id: p.id,
        dexNumber: p.dexNumber,
        name: p.name,
        primaryType: p.primaryType,
        secondaryType: p.secondaryType,
        region: p.region,
        spriteUrl,
      };
    });
  }

  async getStats() {
    const [speciesCount, formsCount, movesCount, typesCount, regionsCount] = await Promise.all([
      this.prisma.pokemonSpecies.count(),
      this.prisma.pokemonForm.count(),
      this.prisma.move.count(),
      this.prisma.type.count(),
      this.prisma.region.count(),
    ]);

    return {
      species: speciesCount,
      forms: formsCount,
      moves: movesCount,
      types: typesCount,
      regions: regionsCount,
    };
  }

  async getRegionStats() {
    const [withRegion, withoutRegion] = await Promise.all([
      this.prisma.pokemonSpecies.count({
        where: {
          regionId: { not: null },
        },
      }),
      this.prisma.pokemonSpecies.count({
        where: {
          regionId: null,
        },
      }),
    ]);

    // Get list of regions with their Pokemon counts
    const regions = await this.prisma.region.findMany({
      include: {
        _count: {
          select: { pokemonSpecies: true },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return {
      withRegion,
      withoutRegion,
      regions: regions.map((r) => ({
        id: r.id,
        name: r.name,
        pokemonCount: r._count.pokemonSpecies,
      })),
    };
  }

  async getMoveById(id: string) {
    return this.prisma.move.findUnique({
      where: { id },
      include: {
        type: true,
      },
    });
  }

  async getPokemonByMove(moveId: string) {
    // Find all PokemonFormMove entries for this move
    const formMoves = await this.prisma.pokemonFormMove.findMany({
      where: { moveId },
      include: {
        form: {
          include: {
            species: {
              include: {
                primaryType: true,
                secondaryType: true,
                forms: {
                  where: {
                    isDefault: true,
                  },
                  include: {
                    assets: {
                      where: {
                        purpose: 'THUMBNAIL',
                      },
                      include: {
                        asset: true,
                      },
                      take: 1,
                    },
                  },
                  take: 1,
                },
              },
            },
            assets: {
              where: {
                purpose: 'THUMBNAIL',
              },
              include: {
                asset: true,
              },
              take: 1,
            },
          },
        },
      },
    });

    // Group by species to avoid duplicates
    const speciesMap = new Map<string, any>();
    
    for (const formMove of formMoves) {
      const speciesId = formMove.form.speciesId;
      if (!speciesMap.has(speciesId)) {
        const defaultForm = formMove.form.species.forms?.[0] || formMove.form;
        const spriteAsset = defaultForm.assets?.[0]?.asset;
        const spriteUrl = spriteAsset?.path || null;
        
        speciesMap.set(speciesId, {
          id: formMove.form.species.id,
          dexNumber: formMove.form.species.dexNumber,
          name: formMove.form.species.name,
          primaryType: formMove.form.species.primaryType,
          secondaryType: formMove.form.species.secondaryType,
          spriteUrl,
        });
      }
    }

    return Array.from(speciesMap.values()).sort((a, b) => a.dexNumber - b.dexNumber);
  }

  async getPokemonByType(typeIdOrName: string) {
    if (!typeIdOrName) {
      return [];
    }

    // Use the same logic as getTypeById to find the type
    const type = await this.getTypeById(typeIdOrName);

    if (!type) {
      // Type not found - return empty array
      // This could happen if the type name format doesn't match what's in the database
      return [];
    }

    // Find all PokemonSpecies that have this type as either primary or secondary type
    const pokemonSpecies = await this.prisma.pokemonSpecies.findMany({
      where: {
        OR: [
          { primaryTypeId: type.id },
          { secondaryTypeId: type.id },
        ],
      },
      include: {
        primaryType: true,
        secondaryType: true,
        region: true,
        forms: {
          where: {
            isDefault: true,
          },
          include: {
            assets: {
              where: {
                purpose: 'THUMBNAIL',
              },
              include: {
                asset: true,
              },
              take: 1,
            },
          },
          take: 1,
        },
      },
      orderBy: {
        dexNumber: 'asc',
      },
    });

    return pokemonSpecies.map((p) => {
      const defaultForm = p.forms?.[0];
      const spriteAsset = defaultForm?.assets?.[0]?.asset;
      const spriteUrl = spriteAsset?.path || null;

      return {
        id: p.id,
        dexNumber: p.dexNumber,
        name: p.name,
        primaryType: p.primaryType,
        secondaryType: p.secondaryType,
        region: p.region,
        spriteUrl,
      };
    });
  }
}

