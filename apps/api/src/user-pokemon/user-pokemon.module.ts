import { Module } from '@nestjs/common';
import { UserPokemonController } from './user-pokemon.controller';
import { UserPokemonService } from './user-pokemon.service';
import { CatalogModule } from '../catalog/catalog.module';

@Module({
  imports: [CatalogModule],
  controllers: [UserPokemonController],
  providers: [UserPokemonService],
  exports: [UserPokemonService],
})
export class UserPokemonModule {}

