/**
 * Type definitions for battle engine
 * All data is passed as plain objects (snapshots), not database entities
 */

export enum MoveCategory {
  FAST = 'FAST',
  CHARGED = 'CHARGED',
}

export interface TypeEffectiveness {
  attackerType: string;
  defenderType: string;
  multiplier: number; // 0.0, 0.5, 1.0, 2.0
}

export interface MoveSnapshot {
  id: string;
  name: string;
  type: string;
  category: MoveCategory;
  power: number;
  energyDelta: number; // Positive for charged, negative for fast
  durationMs: number;
}

export interface PokemonSnapshot {
  formId: string;
  speciesName: string;
  formName: string;
  primaryType: string;
  secondaryType?: string;
  baseAttack: number;
  baseDefense: number;
  baseStamina: number;
  level: number; // 1.0 - 50.0
  ivAtk: number; // 0-15
  ivDef: number; // 0-15
  ivSta: number; // 0-15
  cp?: number; // Optional, can be computed
  hp?: number; // Optional, can be computed
  fastMove: MoveSnapshot;
  chargedMoves: MoveSnapshot[]; // At least one
}

export interface BattleParticipant {
  pokemon: PokemonSnapshot;
  currentHp: number;
  currentEnergy: number;
  shieldsRemaining: number;
  isActive: boolean;
}

export interface BattleAction {
  type: 'FAST_ATTACK' | 'CHARGED_ATTACK' | 'SWAP' | 'SHIELD';
  participantId: string;
  moveId?: string; // For attacks
  timestamp: number; // Relative to battle start (ms)
}

export interface BattleTurn {
  turnNumber: number;
  timestamp: number;
  actions: BattleAction[];
  damageEvents: DamageEvent[];
  energyEvents: EnergyEvent[];
  stateAfter: BattleState;
}

export interface DamageEvent {
  attackerId: string;
  defenderId: string;
  moveId: string;
  damage: number;
  isCritical: boolean;
  effectiveness: number; // 0.0, 0.5, 1.0, 2.0
  defenderHpAfter: number;
}

export interface EnergyEvent {
  participantId: string;
  energyChange: number;
  energyAfter: number;
  source: 'FAST_MOVE' | 'CHARGED_MOVE' | 'DAMAGE_TAKEN';
}

export interface BattleState {
  participants: BattleParticipant[];
  turnNumber: number;
  timestamp: number;
  isComplete: boolean;
  winnerId?: string;
}

export interface BattleRuleset {
  version: string;
  turnDurationMs: number;
  maxEnergy: number;
  shieldsPerSide: number;
  stabMultiplier: number; // Usually 1.2
  typeEffectiveness: TypeEffectiveness[];
  cpMultiplierTable: Record<number, number>; // Level -> CP multiplier
  // Note: Pokémon GO uses a complex CP multiplier formula
  // This table is a simplified version - flag as assumption
}

export interface BattleSimulationInput {
  participant1: PokemonSnapshot;
  participant2: PokemonSnapshot;
  ruleset?: BattleRuleset; // Optional, uses default if not provided
  maxTurns?: number; // Safety limit
}

export interface BattleSimulationResult {
  input: BattleSimulationInput;
  ruleset: BattleRuleset;
  turns: BattleTurn[];
  finalState: BattleState;
  durationMs: number;
  log: string[]; // Text-only battle log
}

