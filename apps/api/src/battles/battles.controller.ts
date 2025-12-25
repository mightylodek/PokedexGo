import { Controller, Post, Body } from '@nestjs/common';
import { BattlesService } from './battles.service';
import { BattleSimulationRequestDto } from '@pokedex-go/shared';

@Controller('battles')
export class BattlesController {
  constructor(private battlesService: BattlesService) {}

  @Post('simulate')
  async simulateBattle(@Body() dto: BattleSimulationRequestDto) {
    return this.battlesService.simulateBattle(dto);
  }
}

