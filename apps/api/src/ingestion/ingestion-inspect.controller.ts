import { Controller, Get } from '@nestjs/common';
import { IngestionService } from './ingestion.service';

/**
 * Public inspection endpoints (no auth required)
 * These are read-only endpoints for debugging and inspection
 */
@Controller('ingestion')
export class IngestionInspectController {
  constructor(private ingestionService: IngestionService) {}

  @Get('inspect-items-public')
  async inspectItemsPublic() {
    return this.ingestionService.inspectItemTemplates();
  }

  @Get('item-sprites')
  async getItemSprites() {
    const result = await this.ingestionService.fetchItemSpriteFileList();
    if (result.success) {
      const mapping = (this.ingestionService as any).createItemSpriteMapping(result.files);
      return {
        ...result,
        mapping,
        mappingCount: Object.keys(mapping).length,
        sampleMappings: Object.entries(mapping).slice(0, 20),
      };
    }
    return result;
  }
}

