import { BattleRuleset } from './types';
export declare function getDefaultRuleset(): BattleRuleset;
export declare function getTypeEffectiveness(attackerType: string, defenderTypes: string[], ruleset: BattleRuleset): number;
