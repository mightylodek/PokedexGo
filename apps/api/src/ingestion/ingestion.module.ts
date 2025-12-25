import { Module } from '@nestjs/common';
import { IngestionController } from './ingestion.controller';
import { IngestionInspectController } from './ingestion-inspect.controller';
import { IngestionService } from './ingestion.service';

@Module({
  controllers: [IngestionController, IngestionInspectController],
  providers: [IngestionService],
})
export class IngestionModule {}

