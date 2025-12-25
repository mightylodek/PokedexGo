/**
 * Type effectiveness utility for calculating Pokemon weaknesses
 * Based on the standard Pokemon GO type effectiveness chart
 */

export interface TypeEffectiveness {
  attackerType: string;
  defenderType: string;
  multiplier: number; // 0.0, 0.5, 1.0, 2.0
}

/**
 * Normalize type name by removing common prefixes and converting to standard format
 */
function normalizeTypeName(typeName: string): string {
  if (!typeName) return 'NORMAL';
  
  let normalized = String(typeName).toUpperCase().trim();
  
  // Remove common prefixes (order matters - try longer/more specific prefixes first)
  normalized = normalized.replace(/^POKEMON_TYPE_/i, '');
  normalized = normalized.replace(/^POKEMONTYPE_/i, '');
  normalized = normalized.replace(/^POKEMONTYPE/i, '');
  normalized = normalized.replace(/^POKEMON_TYPE/i, '');
  normalized = normalized.replace(/^TYPE_/i, '');
  normalized = normalized.replace(/^TYPE/i, '');
  
  // Remove any remaining non-alphabetic characters (underscores, dashes, spaces, etc.)
  normalized = normalized.replace(/[^A-Z]/g, '');
  
  return normalized || 'NORMAL';
}

// Type effectiveness chart - matches the battle-engine ruleset
const TYPE_EFFECTIVENESS: TypeEffectiveness[] = [
  // Normal
  { attackerType: 'NORMAL', defenderType: 'ROCK', multiplier: 0.5 },
  { attackerType: 'NORMAL', defenderType: 'GHOST', multiplier: 0 },
  { attackerType: 'NORMAL', defenderType: 'STEEL', multiplier: 0.5 },
  
  // Fire
  { attackerType: 'FIRE', defenderType: 'FIRE', multiplier: 0.5 },
  { attackerType: 'FIRE', defenderType: 'WATER', multiplier: 0.5 },
  { attackerType: 'FIRE', defenderType: 'GRASS', multiplier: 2.0 },
  { attackerType: 'FIRE', defenderType: 'ICE', multiplier: 2.0 },
  { attackerType: 'FIRE', defenderType: 'BUG', multiplier: 2.0 },
  { attackerType: 'FIRE', defenderType: 'STEEL', multiplier: 2.0 },
  { attackerType: 'FIRE', defenderType: 'ROCK', multiplier: 0.5 },
  { attackerType: 'FIRE', defenderType: 'DRAGON', multiplier: 0.5 },
  
  // Water
  { attackerType: 'WATER', defenderType: 'FIRE', multiplier: 2.0 },
  { attackerType: 'WATER', defenderType: 'WATER', multiplier: 0.5 },
  { attackerType: 'WATER', defenderType: 'GRASS', multiplier: 0.5 },
  { attackerType: 'WATER', defenderType: 'GROUND', multiplier: 2.0 },
  { attackerType: 'WATER', defenderType: 'ROCK', multiplier: 2.0 },
  { attackerType: 'WATER', defenderType: 'DRAGON', multiplier: 0.5 },
  
  // Electric
  { attackerType: 'ELECTRIC', defenderType: 'WATER', multiplier: 2.0 },
  { attackerType: 'ELECTRIC', defenderType: 'ELECTRIC', multiplier: 0.5 },
  { attackerType: 'ELECTRIC', defenderType: 'GRASS', multiplier: 0.5 },
  { attackerType: 'ELECTRIC', defenderType: 'GROUND', multiplier: 0 },
  { attackerType: 'ELECTRIC', defenderType: 'FLYING', multiplier: 2.0 },
  { attackerType: 'ELECTRIC', defenderType: 'DRAGON', multiplier: 0.5 },
  
  // Grass
  { attackerType: 'GRASS', defenderType: 'FIRE', multiplier: 0.5 },
  { attackerType: 'GRASS', defenderType: 'WATER', multiplier: 2.0 },
  { attackerType: 'GRASS', defenderType: 'GRASS', multiplier: 0.5 },
  { attackerType: 'GRASS', defenderType: 'POISON', multiplier: 0.5 },
  { attackerType: 'GRASS', defenderType: 'GROUND', multiplier: 2.0 },
  { attackerType: 'GRASS', defenderType: 'FLYING', multiplier: 0.5 },
  { attackerType: 'GRASS', defenderType: 'BUG', multiplier: 0.5 },
  { attackerType: 'GRASS', defenderType: 'ROCK', multiplier: 2.0 },
  { attackerType: 'GRASS', defenderType: 'DRAGON', multiplier: 0.5 },
  { attackerType: 'GRASS', defenderType: 'STEEL', multiplier: 0.5 },
  
  // Ice
  { attackerType: 'ICE', defenderType: 'FIRE', multiplier: 0.5 },
  { attackerType: 'ICE', defenderType: 'WATER', multiplier: 0.5 },
  { attackerType: 'ICE', defenderType: 'GRASS', multiplier: 2.0 },
  { attackerType: 'ICE', defenderType: 'ICE', multiplier: 0.5 },
  { attackerType: 'ICE', defenderType: 'GROUND', multiplier: 2.0 },
  { attackerType: 'ICE', defenderType: 'FLYING', multiplier: 2.0 },
  { attackerType: 'ICE', defenderType: 'DRAGON', multiplier: 2.0 },
  { attackerType: 'ICE', defenderType: 'STEEL', multiplier: 0.5 },
  
  // Fighting
  { attackerType: 'FIGHTING', defenderType: 'NORMAL', multiplier: 2.0 },
  { attackerType: 'FIGHTING', defenderType: 'ICE', multiplier: 2.0 },
  { attackerType: 'FIGHTING', defenderType: 'POISON', multiplier: 0.5 },
  { attackerType: 'FIGHTING', defenderType: 'FLYING', multiplier: 0.5 },
  { attackerType: 'FIGHTING', defenderType: 'PSYCHIC', multiplier: 0.5 },
  { attackerType: 'FIGHTING', defenderType: 'BUG', multiplier: 0.5 },
  { attackerType: 'FIGHTING', defenderType: 'ROCK', multiplier: 2.0 },
  { attackerType: 'FIGHTING', defenderType: 'GHOST', multiplier: 0 },
  { attackerType: 'FIGHTING', defenderType: 'DARK', multiplier: 2.0 },
  { attackerType: 'FIGHTING', defenderType: 'STEEL', multiplier: 2.0 },
  
  // Poison
  { attackerType: 'POISON', defenderType: 'GRASS', multiplier: 2.0 },
  { attackerType: 'POISON', defenderType: 'POISON', multiplier: 0.5 },
  { attackerType: 'POISON', defenderType: 'GROUND', multiplier: 0.5 },
  { attackerType: 'POISON', defenderType: 'ROCK', multiplier: 0.5 },
  { attackerType: 'POISON', defenderType: 'GHOST', multiplier: 0.5 },
  { attackerType: 'POISON', defenderType: 'STEEL', multiplier: 0 },
  
  // Ground
  { attackerType: 'GROUND', defenderType: 'FIRE', multiplier: 2.0 },
  { attackerType: 'GROUND', defenderType: 'ELECTRIC', multiplier: 2.0 },
  { attackerType: 'GROUND', defenderType: 'GRASS', multiplier: 0.5 },
  { attackerType: 'GROUND', defenderType: 'POISON', multiplier: 2.0 },
  { attackerType: 'GROUND', defenderType: 'FLYING', multiplier: 0 },
  { attackerType: 'GROUND', defenderType: 'BUG', multiplier: 0.5 },
  { attackerType: 'GROUND', defenderType: 'ROCK', multiplier: 2.0 },
  { attackerType: 'GROUND', defenderType: 'STEEL', multiplier: 2.0 },
  
  // Flying
  { attackerType: 'FLYING', defenderType: 'ELECTRIC', multiplier: 0.5 },
  { attackerType: 'FLYING', defenderType: 'GRASS', multiplier: 2.0 },
  { attackerType: 'FLYING', defenderType: 'FIGHTING', multiplier: 2.0 },
  { attackerType: 'FLYING', defenderType: 'BUG', multiplier: 2.0 },
  { attackerType: 'FLYING', defenderType: 'ROCK', multiplier: 0.5 },
  { attackerType: 'FLYING', defenderType: 'STEEL', multiplier: 0.5 },
  
  // Psychic
  { attackerType: 'PSYCHIC', defenderType: 'FIGHTING', multiplier: 2.0 },
  { attackerType: 'PSYCHIC', defenderType: 'POISON', multiplier: 2.0 },
  { attackerType: 'PSYCHIC', defenderType: 'PSYCHIC', multiplier: 0.5 },
  { attackerType: 'PSYCHIC', defenderType: 'DARK', multiplier: 0 },
  { attackerType: 'PSYCHIC', defenderType: 'STEEL', multiplier: 0.5 },
  
  // Bug
  { attackerType: 'BUG', defenderType: 'FIRE', multiplier: 0.5 },
  { attackerType: 'BUG', defenderType: 'GRASS', multiplier: 2.0 },
  { attackerType: 'BUG', defenderType: 'FIGHTING', multiplier: 0.5 },
  { attackerType: 'BUG', defenderType: 'POISON', multiplier: 0.5 },
  { attackerType: 'BUG', defenderType: 'FLYING', multiplier: 0.5 },
  { attackerType: 'BUG', defenderType: 'PSYCHIC', multiplier: 2.0 },
  { attackerType: 'BUG', defenderType: 'GHOST', multiplier: 0.5 },
  { attackerType: 'BUG', defenderType: 'DARK', multiplier: 2.0 },
  { attackerType: 'BUG', defenderType: 'STEEL', multiplier: 0.5 },
  
  // Rock
  { attackerType: 'ROCK', defenderType: 'FIRE', multiplier: 2.0 },
  { attackerType: 'ROCK', defenderType: 'ICE', multiplier: 2.0 },
  { attackerType: 'ROCK', defenderType: 'FIGHTING', multiplier: 0.5 },
  { attackerType: 'ROCK', defenderType: 'GROUND', multiplier: 0.5 },
  { attackerType: 'ROCK', defenderType: 'FLYING', multiplier: 2.0 },
  { attackerType: 'ROCK', defenderType: 'BUG', multiplier: 2.0 },
  { attackerType: 'ROCK', defenderType: 'STEEL', multiplier: 0.5 },
  
  // Ghost
  { attackerType: 'GHOST', defenderType: 'NORMAL', multiplier: 0 },
  { attackerType: 'GHOST', defenderType: 'PSYCHIC', multiplier: 2.0 },
  { attackerType: 'GHOST', defenderType: 'GHOST', multiplier: 2.0 },
  { attackerType: 'GHOST', defenderType: 'DARK', multiplier: 0.5 },
  
  // Dragon
  { attackerType: 'DRAGON', defenderType: 'DRAGON', multiplier: 2.0 },
  { attackerType: 'DRAGON', defenderType: 'STEEL', multiplier: 0.5 },
  
  // Dark
  { attackerType: 'DARK', defenderType: 'FIGHTING', multiplier: 0.5 },
  { attackerType: 'DARK', defenderType: 'PSYCHIC', multiplier: 2.0 },
  { attackerType: 'DARK', defenderType: 'GHOST', multiplier: 2.0 },
  { attackerType: 'DARK', defenderType: 'DARK', multiplier: 0.5 },
  { attackerType: 'DARK', defenderType: 'STEEL', multiplier: 0.5 },
  
  // Steel
  { attackerType: 'STEEL', defenderType: 'FIRE', multiplier: 0.5 },
  { attackerType: 'STEEL', defenderType: 'WATER', multiplier: 0.5 },
  { attackerType: 'STEEL', defenderType: 'ELECTRIC', multiplier: 0.5 },
  { attackerType: 'STEEL', defenderType: 'ICE', multiplier: 2.0 },
  { attackerType: 'STEEL', defenderType: 'ROCK', multiplier: 2.0 },
  { attackerType: 'STEEL', defenderType: 'STEEL', multiplier: 0.5 },
  
  // Fairy
  { attackerType: 'FAIRY', defenderType: 'FIRE', multiplier: 0.5 },
  { attackerType: 'FAIRY', defenderType: 'FIGHTING', multiplier: 2.0 },
  { attackerType: 'FAIRY', defenderType: 'POISON', multiplier: 0.5 },
  { attackerType: 'FAIRY', defenderType: 'DRAGON', multiplier: 2.0 },
  { attackerType: 'FAIRY', defenderType: 'DARK', multiplier: 2.0 },
  { attackerType: 'FAIRY', defenderType: 'STEEL', multiplier: 0.5 },
];

/**
 * Calculate the effectiveness multiplier for an attacker type against defender types
 */
function getTypeEffectiveness(
  attackerType: string,
  defenderTypes: string[]
): number {
  let multiplier = 1.0;
  
  const normalizedAttackerType = normalizeTypeName(attackerType);
  
  for (const defenderType of defenderTypes) {
    const normalizedDefenderType = normalizeTypeName(defenderType);
    const effectiveness = TYPE_EFFECTIVENESS.find(
      (e) => e.attackerType === normalizedAttackerType && 
             e.defenderType === normalizedDefenderType
    );
    
    if (effectiveness) {
      multiplier *= effectiveness.multiplier;
    }
  }
  
  return multiplier;
}

/**
 * Get all Pokemon types that are super effective (multiplier > 1.0) against the given Pokemon types
 * Returns an array of type names that the Pokemon is weak against
 */
export function getWeakAgainstTypes(
  primaryType: string,
  secondaryType?: string | null
): string[] {
  // All possible Pokemon types
  const allTypes = [
    'NORMAL', 'FIRE', 'WATER', 'ELECTRIC', 'GRASS', 'ICE',
    'FIGHTING', 'POISON', 'GROUND', 'FLYING', 'PSYCHIC', 'BUG',
    'ROCK', 'GHOST', 'DRAGON', 'DARK', 'STEEL', 'FAIRY'
  ];
  
  const defenderTypes = [primaryType];
  if (secondaryType) {
    defenderTypes.push(secondaryType);
  }
  
  const weakAgainst: string[] = [];
  
  for (const attackerType of allTypes) {
    const effectiveness = getTypeEffectiveness(attackerType, defenderTypes);
    if (effectiveness > 1.0) {
      weakAgainst.push(attackerType);
    }
  }
  
  return weakAgainst;
}

/**
 * Get all Pokemon types that the given Pokemon types are super effective (multiplier > 1.0) against
 * Returns an array of type names that the Pokemon is strong against
 */
export function getStrongAgainstTypes(
  primaryType: string,
  secondaryType?: string | null
): string[] {
  // All possible Pokemon types
  const allTypes = [
    'NORMAL', 'FIRE', 'WATER', 'ELECTRIC', 'GRASS', 'ICE',
    'FIGHTING', 'POISON', 'GROUND', 'FLYING', 'PSYCHIC', 'BUG',
    'ROCK', 'GHOST', 'DRAGON', 'DARK', 'STEEL', 'FAIRY'
  ];
  
  const attackerTypes = [primaryType];
  if (secondaryType) {
    attackerTypes.push(secondaryType);
  }
  
  const strongAgainst: string[] = [];
  
  // For each potential defender type, check if any of the Pokemon's types are super effective
  for (const defenderType of allTypes) {
    let maxEffectiveness = 1.0;
    
    // Check effectiveness of each of the Pokemon's types against this defender
    for (const attackerType of attackerTypes) {
      const effectiveness = getTypeEffectiveness(attackerType, [defenderType]);
      maxEffectiveness = Math.max(maxEffectiveness, effectiveness);
    }
    
    // If any of the Pokemon's types are super effective, add it to the list
    if (maxEffectiveness > 1.0) {
      strongAgainst.push(defenderType);
    }
  }
  
  return strongAgainst;
}

