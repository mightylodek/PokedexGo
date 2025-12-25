import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CatalogService } from '../catalog/catalog.service';
import {
  simulateBattle,
  PokemonSnapshot,
  MoveSnapshot,
  MoveCategory,
} from '@pokedex-go/battle-engine';
import { BattleSimulationRequestDto } from '@pokedex-go/shared';

@Injectable()
export class BattlesService {
  constructor(
    private prisma: PrismaService,
    private catalogService: CatalogService
  ) {}

  /**
   * Build a battle-ready snapshot from catalog data
   * This is the bridge between catalog (database) and battle engine (pure logic)
   */
  async buildPokemonSnapshot(
    formId: string,
    level: number = 40,
    ivAtk: number = 15,
    ivDef: number = 15,
    ivSta: number = 15
  ): Promise<PokemonSnapshot> {
    const form = await this.catalogService.getPokemonFormById(formId);
    
    if (!form) {
      throw new NotFoundException(`Pokemon form ${formId} not found`);
    }
    
    // Get fast move (first FAST move from learnset)
    const fastMoveData = form.moves.find(
      (fm) => fm.move.category === 'FAST' && fm.learnMethod === 'FAST'
    );
    
    if (!fastMoveData) {
      throw new NotFoundException(`No fast move found for form ${formId}`);
    }
    
    // Get charged moves (all CHARGED moves)
    const chargedMovesData = form.moves.filter(
      (cm) => cm.move.category === 'CHARGED'
    );
    
    if (chargedMovesData.length === 0) {
      throw new NotFoundException(`No charged moves found for form ${formId}`);
    }
    
    // Convert to battle engine format
    const fastMove: MoveSnapshot = {
      id: fastMoveData.move.id,
      name: fastMoveData.move.name,
      type: fastMoveData.move.type.name,
      category: MoveCategory.FAST,
      power: fastMoveData.move.power,
      energyDelta: fastMoveData.move.energyDelta,
      durationMs: fastMoveData.move.durationMs,
    };
    
    const chargedMoves: MoveSnapshot[] = chargedMovesData.map((cm) => ({
      id: cm.move.id,
      name: cm.move.name,
      type: cm.move.type.name,
      category: MoveCategory.CHARGED,
      power: cm.move.power,
      energyDelta: cm.move.energyDelta,
      durationMs: cm.move.durationMs,
    }));
    
    return {
      formId: form.id,
      speciesName: form.species.name,
      formName: form.formName,
      primaryType: form.species.primaryType.name,
      secondaryType: form.species.secondaryType?.name,
      baseAttack: form.baseAttack,
      baseDefense: form.baseDefense,
      baseStamina: form.baseStamina,
      level,
      ivAtk,
      ivDef,
      ivSta,
      fastMove,
      chargedMoves,
    };
  }

  /**
   * Simulate a battle using the battle engine
   */
  async simulateBattle(dto: BattleSimulationRequestDto) {
    const participant1 = await this.buildPokemonSnapshot(
      dto.participant1FormId,
      dto.participant1Level || 40,
      dto.participant1IvAtk ?? 15,
      dto.participant1IvDef ?? 15,
      dto.participant1IvSta ?? 15
    );
    
    const participant2 = await this.buildPokemonSnapshot(
      dto.participant2FormId,
      dto.participant2Level || 40,
      dto.participant2IvAtk ?? 15,
      dto.participant2IvDef ?? 15,
      dto.participant2IvSta ?? 15
    );
    
    const result = simulateBattle({
      participant1,
      participant2,
    });
    
    return result;
  }
}

