import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ingestion')
@UseGuards(JwtAuthGuard)
export class IngestionController {
  constructor(private ingestionService: IngestionService) {}

  @Get('history')
  async getHistory() {
    return this.ingestionService.getIngestionHistory();
  }

  @Get('state')
  async getState() {
    return this.ingestionService.getIngestionState();
  }

  @Get('check-updates')
  async checkUpdates() {
    return this.ingestionService.checkForUpdates();
  }

  @Post('run')
  async runIngestion() {
    const result = await this.ingestionService.runIngestion();
    return { message: 'Ingestion completed', ...result };
  }

  @Get('test-connection')
  async testConnection() {
    return this.ingestionService.testGameMasterConnection();
  }

  @Get('parse-test')
  async parseTest() {
    return this.ingestionService.testParsing();
  }

  @Get('current-run')
  async getCurrentRun() {
    return this.ingestionService.getCurrentRun();
  }

  @Get('latest-errors')
  async getLatestErrors() {
    return this.ingestionService.getLatestErrors();
  }

  @Post('run-items')
  async runItemsIngestion() {
    const result = await this.ingestionService.runItemsIngestion();
    return { message: 'Items ingestion completed', ...result };
  }

  @Get('inspect-items')
  async inspectItems() {
    return this.ingestionService.inspectItemTemplates();
  }
}

