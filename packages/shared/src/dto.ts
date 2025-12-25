import { IsEmail, IsString, IsOptional, IsNumber, IsBoolean, Min, Max } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;

  @IsOptional()
  @IsString()
  displayName?: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

export class CreatePokemonInstanceDto {
  @IsString()
  formId!: string;

  @IsOptional()
  @IsString()
  nickname?: string;

  @IsNumber()
  @Min(2)
  @Max(100)
  levelTimes2!: number; // Level * 2

  @IsNumber()
  @Min(0)
  @Max(15)
  ivAtk!: number;

  @IsNumber()
  @Min(0)
  @Max(15)
  ivDef!: number;

  @IsNumber()
  @Min(0)
  @Max(15)
  ivSta!: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  favorite?: boolean;
}

export class UpdatePokemonInstanceDto {
  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsNumber()
  @Min(2)
  @Max(100)
  levelTimes2?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(15)
  ivAtk?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(15)
  ivDef?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(15)
  ivSta?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  favorite?: boolean;
}

export class BattleSimulationRequestDto {
  @IsString()
  participant1FormId!: string;

  @IsString()
  participant2FormId!: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  participant1Level?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  participant2Level?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(15)
  participant1IvAtk?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(15)
  participant1IvDef?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(15)
  participant1IvSta?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(15)
  participant2IvAtk?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(15)
  participant2IvDef?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(15)
  participant2IvSta?: number;
}

