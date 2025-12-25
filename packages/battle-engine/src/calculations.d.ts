import { PokemonSnapshot, MoveSnapshot, BattleRuleset, BattleParticipant } from './types';
export declare function calculateCP(baseAttack: number, baseDefense: number, baseStamina: number, ivAtk: number, ivDef: number, ivSta: number, level: number, ruleset: BattleRuleset): number;
export declare function calculateHP(baseStamina: number, ivSta: number, level: number, ruleset: BattleRuleset): number;
export declare function calculateDamage(move: MoveSnapshot, attacker: PokemonSnapshot, defender: PokemonSnapshot, ruleset: BattleRuleset): number;
export declare function calculateEnergyGain(move: MoveSnapshot): number;
export declare function calculateEnergyCost(move: MoveSnapshot): number;
export declare function createParticipant(pokemon: PokemonSnapshot, participantId: string, ruleset: BattleRuleset): BattleParticipant;
