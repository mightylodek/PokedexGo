import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller('catalog')
export class CatalogController {
  constructor(private catalogService: CatalogService) {}

  @Get('pokemon')
  async getPokemonSpecies(
    @Query('skip') skip?: string,
    @Query('take') take?: string
  ) {
    return this.catalogService.getPokemonSpecies(
      skip ? parseInt(skip, 10) : 0,
      take ? parseInt(take, 10) : 50
    );
  }

  @Get('pokemon/:id')
  async getPokemonSpeciesById(@Param('id') id: string) {
    return this.catalogService.getPokemonSpeciesById(id);
  }

  @Get('forms/:id')
  async getPokemonFormById(@Param('id') id: string) {
    return this.catalogService.getPokemonFormById(id);
  }

  @Get('moves')
  async getMoves(
    @Query('skip') skip?: string,
    @Query('take') take?: string
  ) {
    return this.catalogService.getMoves(
      skip ? parseInt(skip, 10) : 0,
      take ? parseInt(take, 10) : 100
    );
  }

  @Get('types')
  async getTypes() {
    return this.catalogService.getTypes();
  }

  @Get('types/:id')
  async getTypeById(@Param('id') id: string) {
    const type = await this.catalogService.getTypeById(id);
    if (!type) {
      // Return 404 if type not found
      throw new NotFoundException(`Type not found: ${id}`);
    }
    return type;
  }

  @Get('regions')
  async getRegions() {
    return this.catalogService.getRegions();
  }

  @Get('regions/stats')
  async getRegionStats() {
    return this.catalogService.getRegionStats();
  }

  @Get('regions/:id')
  async getRegionById(@Param('id') id: string) {
    const region = await this.catalogService.getRegionById(id);
    if (!region) {
      throw new NotFoundException(`Region not found: ${id}`);
    }
    return region;
  }

  @Get('regions/:id/pokemon')
  async getPokemonByRegion(@Param('id') id: string) {
    return this.catalogService.getPokemonByRegion(id);
  }

  @Get('stats')
  async getStats() {
    return this.catalogService.getStats();
  }

  @Get('moves/:id')
  async getMoveById(@Param('id') id: string) {
    return this.catalogService.getMoveById(id);
  }

  @Get('moves/:id/pokemon')
  async getPokemonByMove(@Param('id') id: string) {
    return this.catalogService.getPokemonByMove(id);
  }

  @Get('types/:id/pokemon')
  async getPokemonByType(@Param('id') id: string) {
    return this.catalogService.getPokemonByType(id);
  }

  @Get('types/:id/moves')
  async getMovesByType(@Param('id') id: string) {
    return this.catalogService.getMovesByType(id);
  }
}
