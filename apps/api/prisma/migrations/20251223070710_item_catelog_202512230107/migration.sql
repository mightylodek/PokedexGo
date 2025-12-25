-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('POKEBALL', 'BERRY', 'POTION', 'REVIVE', 'INCENSE', 'LURE_MODULE', 'EGG', 'INCUBATOR', 'STAR_PIECE', 'LUCKY_EGG', 'TMS', 'RARE_CANDY', 'STARDUST', 'OTHER');

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ItemType" NOT NULL,
    "description" TEXT,
    "features" TEXT,
    "obtainedFrom" TEXT,
    "spritePath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Item_itemKey_key" ON "Item"("itemKey");

-- CreateIndex
CREATE INDEX "Item_type_idx" ON "Item"("type");

-- CreateIndex
CREATE INDEX "Item_itemKey_idx" ON "Item"("itemKey");
