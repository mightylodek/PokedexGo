-- AlterTable
ALTER TABLE "PokemonSpecies" ADD COLUMN     "evolutionId" TEXT,
ADD COLUMN     "familyId" TEXT,
ADD COLUMN     "parentPokemonId" TEXT;

-- AddForeignKey
ALTER TABLE "PokemonSpecies" ADD CONSTRAINT "PokemonSpecies_parentPokemonId_fkey" FOREIGN KEY ("parentPokemonId") REFERENCES "PokemonSpecies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
