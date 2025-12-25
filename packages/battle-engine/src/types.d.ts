export declare enum MoveCategory {
    FAST = "FAST",
    CHARGED = "CHARGED"
}
export interface TypeEffectiveness {
    attackerType: string;
    defenderType: string;
    multiplier: number;
}
export interface MoveSnapshot {
    id: string;
    name: string;
    type: string;
    category: MoveCategory;
    power: number;
    energyDelta: number;
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
    level: number;
    ivAtk: number;
    ivDef: number;
    ivSta: number;
    cp?: number;
    hp?: number;
    fastMove: MoveSnapshot;
    chargedMoves: MoveSnapshot[];
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
    moveId?: string;
    timestamp: number;
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
    effectiveness: number;
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
    stabMultiplier: number;
    typeEffectiveness: TypeEffectiveness[];
    cpMultiplierTable: Record<number, number>;
}
export interface BattleSimulationInput {
    participant1: PokemonSnapshot;
    participant2: PokemonSnapshot;
    ruleset?: BattleRuleset;
    maxTurns?: number;
}
export interface BattleSimulationResult {
    input: BattleSimulationInput;
    ruleset: BattleRuleset;
    turns: BattleTurn[];
    finalState: BattleState;
    durationMs: number;
    log: string[];
}
