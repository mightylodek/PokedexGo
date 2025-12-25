import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { ItemsModule } from './items/items.module';
import { BattlesModule } from './battles/battles.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { UserPokemonModule } from './user-pokemon/user-pokemon.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'], // Look in project root and current directory
    }),
    PrismaModule,
    AuthModule,
    CatalogModule,
    ItemsModule,
    BattlesModule,
    IngestionModule,
    UserPokemonModule,
  ],
})
export class AppModule {}

