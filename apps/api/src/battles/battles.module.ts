import { Module } from '@nestjs/common';
import { BattlesController } from './battles.controller';
import { BattlesService } from './battles.service';
import { CatalogModule } from '../catalog/catalog.module';

@Module({
  imports: [CatalogModule],
  controllers: [BattlesController],
  providers: [BattlesService],
})
export class BattlesModule {}

