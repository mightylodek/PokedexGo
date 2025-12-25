import {
  PokemonSnapshot,
  MoveSnapshot,
  BattleRuleset,
  BattleParticipant,
} from './types';
import { getTypeEffectiveness } from './ruleset';

/**
 * Pure calculation functions
 * No side effects, deterministic
 */

/**
 * Calculate CP (Combat Power) for a Pokémon
 * Formula: CP = floor((Attack * Defense^0.5 * Stamina^0.5 * CP_Multiplier^2) / 10)
 * 
 * ASSUMPTION: This is the simplified GO formula. Actual formula may vary by game version.
 */
export function calculateCP(
  baseAttack: number,
  baseDefense: number,
  baseStamina: number,
  ivAtk: number,
  ivDef: number,
  ivSta: number,
  level: number,
  ruleset: BattleRuleset
): number {
  const attack = baseAttack + ivAtk;
  const defense = baseDefense + ivDef;
  const stamina = baseStamina + ivSta;
  
  const cpMultiplier = ruleset.cpMultiplierTable[level] || ruleset.cpMultiplierTable[40];
  const cpMultiplierSquared = cpMultiplier * cpMultiplier;
  
  const cp = Math.floor(
    (attack * Math.sqrt(defense) * Math.sqrt(stamina) * cpMultiplierSquared) / 10
  );
  
  return Math.max(1, cp); // Minimum CP of 1
}

/**
 * Calculate HP (Hit Points) for a Pokémon
 * Formula: HP = floor((Stamina + IV_Sta) * CP_Multiplier)
 * 
 * ASSUMPTION: Simplified GO formula
 */
export function calculateHP(
  baseStamina: number,
  ivSta: number,
  level: number,
  ruleset: BattleRuleset
): number {
  const stamina = baseStamina + ivSta;
  const cpMultiplier = ruleset.cpMultiplierTable[level] || ruleset.cpMultiplierTable[40];
  
  const hp = Math.floor(stamina * cpMultiplier);
  return Math.max(1, hp); // Minimum HP of 1
}

/**
 * Calculate damage for a move
 * 
 * Formula (simplified):
 * Damage = floor(0.5 * Power * (Attack / Defense) * STAB * Effectiveness) + 1
 * 
 * ASSUMPTION: This is a simplified damage formula. Actual GO uses more complex calculations
 * including fast move damage windows, charge move timing, etc.
 */
export function calculateDamage(
  move: MoveSnapshot,
  attacker: PokemonSnapshot,
  defender: PokemonSnapshot,
  ruleset: BattleRuleset
): number {
  const attackerAttack = attacker.baseAttack + attacker.ivAtk;
  const defenderDefense = defender.baseDefense + defender.ivDef;
  
  // Get attacker's level multiplier
  const attackerLevel = attacker.level;
  const attackerCpMultiplier = ruleset.cpMultiplierTable[attackerLevel] || ruleset.cpMultiplierTable[40];
  
  // Get defender's level multiplier
  const defenderLevel = defender.level;
  const defenderCpMultiplier = ruleset.cpMultiplierTable[defenderLevel] || ruleset.cpMultiplierTable[40];
  
  // Calculate attack and defense stats
  const attackStat = attackerAttack * attackerCpMultiplier;
  const defenseStat = defenderDefense * defenderCpMultiplier;
  
  // STAB (Same Type Attack Bonus)
  const isStab =
    move.type === attacker.primaryType || move.type === attacker.secondaryType;
  const stabMultiplier = isStab ? ruleset.stabMultiplier : 1.0;
  
  // Type effectiveness
  const defenderTypes = [defender.primaryType];
  if (defender.secondaryType) {
    defenderTypes.push(defender.secondaryType);
  }
  const effectiveness = getTypeEffectiveness(move.type, defenderTypes, ruleset);
  
  // Base damage calculation
  const baseDamage = 0.5 * move.power * (attackStat / defenseStat) * stabMultiplier * effectiveness;
  
  // Floor and add 1 (minimum damage)
  const damage = Math.floor(baseDamage) + 1;
  
  return Math.max(1, damage);
}

/**
 * Calculate energy gain from a fast move
 * Energy delta is negative for fast moves (they generate energy)
 */
export function calculateEnergyGain(move: MoveSnapshot): number {
  if (move.category !== 'FAST') {
    return 0;
  }
  // Energy delta is negative for fast moves, so we return the absolute value
  return Math.abs(move.energyDelta);
}

/**
 * Calculate energy cost for a charged move
 * Energy delta is positive for charged moves (they cost energy)
 */
export function calculateEnergyCost(move: MoveSnapshot): number {
  if (move.category !== 'CHARGED') {
    return 0;
  }
  return move.energyDelta;
}

/**
 * Create a battle participant from a Pokémon snapshot
 */
export function createParticipant(
  pokemon: PokemonSnapshot,
  participantId: string,
  ruleset: BattleRuleset
): BattleParticipant {
  const maxHp = pokemon.hp || calculateHP(
    pokemon.baseStamina,
    pokemon.ivSta,
    pokemon.level,
    ruleset
  );
  
  return {
    pokemon,
    currentHp: maxHp,
    currentEnergy: 0,
    shieldsRemaining: ruleset.shieldsPerSide,
    isActive: true,
  };
}

