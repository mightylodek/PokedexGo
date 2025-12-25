export declare class RegisterDto {
    email: string;
    password: string;
    displayName?: string;
}
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class CreatePokemonInstanceDto {
    formId: string;
    nickname?: string;
    levelTimes2: number;
    ivAtk: number;
    ivDef: number;
    ivSta: number;
    notes?: string;
    favorite?: boolean;
}
export declare class UpdatePokemonInstanceDto {
    nickname?: string;
    levelTimes2?: number;
    ivAtk?: number;
    ivDef?: number;
    ivSta?: number;
    notes?: string;
    favorite?: boolean;
}
export declare class BattleSimulationRequestDto {
    participant1FormId: string;
    participant2FormId: string;
    participant1Level?: number;
    participant2Level?: number;
    participant1IvAtk?: number;
    participant1IvDef?: number;
    participant1IvSta?: number;
    participant2IvAtk?: number;
    participant2IvDef?: number;
    participant2IvSta?: number;
}
