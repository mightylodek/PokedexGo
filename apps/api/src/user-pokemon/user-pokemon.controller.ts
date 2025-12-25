import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UserPokemonService } from './user-pokemon.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreatePokemonInstanceDto,
  UpdatePokemonInstanceDto,
} from '@pokedex-go/shared';

@Controller('me/pokemon')
@UseGuards(JwtAuthGuard)
export class UserPokemonController {
  constructor(private userPokemonService: UserPokemonService) {}

  @Post()
  async createInstance(
    @Request() req,
    @Body() dto: CreatePokemonInstanceDto
  ) {
    return this.userPokemonService.createInstance(req.user.id, dto);
  }

  @Get()
  async getUserInstances(
    @Request() req,
    @Query('skip') skip?: string,
    @Query('take') take?: string
  ) {
    return this.userPokemonService.getUserInstances(
      req.user.id,
      skip ? parseInt(skip, 10) : 0,
      take ? parseInt(take, 10) : 50
    );
  }

  @Get('stats')
  async getCollectionStats(@Request() req) {
    return this.userPokemonService.getCollectionStats(req.user.id);
  }

  @Get(':id')
  async getInstanceById(@Request() req, @Param('id') id: string) {
    return this.userPokemonService.getInstanceById(req.user.id, id);
  }

  @Patch(':id')
  async updateInstance(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdatePokemonInstanceDto
  ) {
    return this.userPokemonService.updateInstance(req.user.id, id, dto);
  }

  @Delete(':id')
  async deleteInstance(@Request() req, @Param('id') id: string) {
    await this.userPokemonService.deleteInstance(req.user.id, id);
    return { message: 'Pokemon instance deleted successfully' };
  }
}

