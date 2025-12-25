-- CreateEnum
CREATE TYPE "MoveCategory" AS ENUM ('FAST', 'CHARGED');

-- CreateEnum
CREATE TYPE "LearnMethod" AS ENUM ('FAST', 'CHARGED', 'ELITE_FAST', 'ELITE_CHARGED', 'LEGACY');

-- CreateEnum
CREATE TYPE "AssetKind" AS ENUM ('SPRITE_STATIC', 'SPRITE_ANIMATED', 'ICON');

-- CreateEnum
CREATE TYPE "AssetPurpose" AS ENUM ('THUMBNAIL', 'DETAIL', 'ANIMATED');

-- CreateEnum
CREATE TYPE "FriendshipStatus" AS ENUM ('PENDING', 'ACCEPTED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "IngestionRunStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "Type" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PokemonSpecies" (
    "id" TEXT NOT NULL,
    "dexNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "generation" INTEGER NOT NULL,
    "primaryTypeId" TEXT NOT NULL,
    "secondaryTypeId" TEXT,
    "regionId" TEXT,
    "isLegendary" BOOLEAN NOT NULL DEFAULT false,
    "isMythical" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PokemonSpecies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PokemonForm" (
    "id" TEXT NOT NULL,
    "speciesId" TEXT NOT NULL,
    "formKey" TEXT NOT NULL,
    "formName" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isShinyAvailable" BOOLEAN NOT NULL DEFAULT false,
    "baseAttack" INTEGER NOT NULL,
    "baseDefense" INTEGER NOT NULL,
    "baseStamina" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PokemonForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Move" (
    "id" TEXT NOT NULL,
    "moveKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,
    "category" "MoveCategory" NOT NULL,
    "power" INTEGER NOT NULL,
    "energyDelta" INTEGER NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Move_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PokemonFormMove" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "moveId" TEXT NOT NULL,
    "learnMethod" "LearnMethod" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PokemonFormMove_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "kind" "AssetKind" NOT NULL,
    "mimeType" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PokemonFormAsset" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "purpose" "AssetPurpose" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PokemonFormAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFavorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPokemonInstance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "nickname" TEXT,
    "levelTimes2" INTEGER NOT NULL,
    "ivAtk" INTEGER NOT NULL,
    "ivDef" INTEGER NOT NULL,
    "ivSta" INTEGER NOT NULL,
    "cp" INTEGER,
    "hp" INTEGER,
    "notes" TEXT,
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPokemonInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPokemonTag" (
    "id" TEXT NOT NULL,
    "userPokemonInstanceId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPokemonTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Friendship" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "addresseeId" TEXT NOT NULL,
    "status" "FriendshipStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Friendship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedList" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isPublicToFriends" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SharedList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedListEntry" (
    "id" TEXT NOT NULL,
    "sharedListId" TEXT NOT NULL,
    "formId" TEXT,
    "userPokemonInstanceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharedListEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestionState" (
    "id" TEXT NOT NULL,
    "lastTimestamp" TEXT,
    "lastSuccess" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IngestionState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestionRun" (
    "id" TEXT NOT NULL,
    "status" "IngestionRunStatus" NOT NULL,
    "summary" TEXT,
    "errors" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IngestionRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Type_name_key" ON "Type"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Region_name_key" ON "Region"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PokemonSpecies_dexNumber_key" ON "PokemonSpecies"("dexNumber");

-- CreateIndex
CREATE INDEX "PokemonForm_speciesId_idx" ON "PokemonForm"("speciesId");

-- CreateIndex
CREATE UNIQUE INDEX "PokemonForm_speciesId_formKey_key" ON "PokemonForm"("speciesId", "formKey");

-- CreateIndex
CREATE UNIQUE INDEX "Move_moveKey_key" ON "Move"("moveKey");

-- CreateIndex
CREATE INDEX "PokemonFormMove_formId_idx" ON "PokemonFormMove"("formId");

-- CreateIndex
CREATE INDEX "PokemonFormMove_moveId_idx" ON "PokemonFormMove"("moveId");

-- CreateIndex
CREATE UNIQUE INDEX "PokemonFormMove_formId_moveId_learnMethod_key" ON "PokemonFormMove"("formId", "moveId", "learnMethod");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_sha256_key" ON "Asset"("sha256");

-- CreateIndex
CREATE INDEX "PokemonFormAsset_formId_idx" ON "PokemonFormAsset"("formId");

-- CreateIndex
CREATE UNIQUE INDEX "PokemonFormAsset_formId_assetId_purpose_key" ON "PokemonFormAsset"("formId", "assetId", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_tokenHash_idx" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "UserFavorite_userId_idx" ON "UserFavorite"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserFavorite_userId_formId_key" ON "UserFavorite"("userId", "formId");

-- CreateIndex
CREATE INDEX "UserPokemonInstance_userId_idx" ON "UserPokemonInstance"("userId");

-- CreateIndex
CREATE INDEX "UserPokemonInstance_formId_idx" ON "UserPokemonInstance"("formId");

-- CreateIndex
CREATE INDEX "Tag_userId_idx" ON "Tag"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_userId_name_key" ON "Tag"("userId", "name");

-- CreateIndex
CREATE INDEX "UserPokemonTag_userPokemonInstanceId_idx" ON "UserPokemonTag"("userPokemonInstanceId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPokemonTag_userPokemonInstanceId_tagId_key" ON "UserPokemonTag"("userPokemonInstanceId", "tagId");

-- CreateIndex
CREATE INDEX "Friendship_requesterId_idx" ON "Friendship"("requesterId");

-- CreateIndex
CREATE INDEX "Friendship_addresseeId_idx" ON "Friendship"("addresseeId");

-- CreateIndex
CREATE UNIQUE INDEX "Friendship_requesterId_addresseeId_key" ON "Friendship"("requesterId", "addresseeId");

-- CreateIndex
CREATE INDEX "SharedList_ownerId_idx" ON "SharedList"("ownerId");

-- CreateIndex
CREATE INDEX "SharedListEntry_sharedListId_idx" ON "SharedListEntry"("sharedListId");

-- CreateIndex
CREATE INDEX "SharedListEntry_formId_idx" ON "SharedListEntry"("formId");

-- CreateIndex
CREATE INDEX "SharedListEntry_userPokemonInstanceId_idx" ON "SharedListEntry"("userPokemonInstanceId");

-- CreateIndex
CREATE UNIQUE INDEX "IngestionState_id_key" ON "IngestionState"("id");

-- CreateIndex
CREATE INDEX "IngestionRun_status_idx" ON "IngestionRun"("status");

-- CreateIndex
CREATE INDEX "IngestionRun_startedAt_idx" ON "IngestionRun"("startedAt");

-- AddForeignKey
ALTER TABLE "PokemonSpecies" ADD CONSTRAINT "PokemonSpecies_primaryTypeId_fkey" FOREIGN KEY ("primaryTypeId") REFERENCES "Type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokemonSpecies" ADD CONSTRAINT "PokemonSpecies_secondaryTypeId_fkey" FOREIGN KEY ("secondaryTypeId") REFERENCES "Type"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokemonSpecies" ADD CONSTRAINT "PokemonSpecies_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokemonForm" ADD CONSTRAINT "PokemonForm_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "PokemonSpecies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Move" ADD CONSTRAINT "Move_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "Type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokemonFormMove" ADD CONSTRAINT "PokemonFormMove_formId_fkey" FOREIGN KEY ("formId") REFERENCES "PokemonForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokemonFormMove" ADD CONSTRAINT "PokemonFormMove_moveId_fkey" FOREIGN KEY ("moveId") REFERENCES "Move"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokemonFormAsset" ADD CONSTRAINT "PokemonFormAsset_formId_fkey" FOREIGN KEY ("formId") REFERENCES "PokemonForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokemonFormAsset" ADD CONSTRAINT "PokemonFormAsset_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFavorite" ADD CONSTRAINT "UserFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFavorite" ADD CONSTRAINT "UserFavorite_formId_fkey" FOREIGN KEY ("formId") REFERENCES "PokemonForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPokemonInstance" ADD CONSTRAINT "UserPokemonInstance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPokemonInstance" ADD CONSTRAINT "UserPokemonInstance_formId_fkey" FOREIGN KEY ("formId") REFERENCES "PokemonForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPokemonTag" ADD CONSTRAINT "UserPokemonTag_userPokemonInstanceId_fkey" FOREIGN KEY ("userPokemonInstanceId") REFERENCES "UserPokemonInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPokemonTag" ADD CONSTRAINT "UserPokemonTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_addresseeId_fkey" FOREIGN KEY ("addresseeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedList" ADD CONSTRAINT "SharedList_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedListEntry" ADD CONSTRAINT "SharedListEntry_sharedListId_fkey" FOREIGN KEY ("sharedListId") REFERENCES "SharedList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedListEntry" ADD CONSTRAINT "SharedListEntry_formId_fkey" FOREIGN KEY ("formId") REFERENCES "PokemonForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedListEntry" ADD CONSTRAINT "SharedListEntry_userPokemonInstanceId_fkey" FOREIGN KEY ("userPokemonInstanceId") REFERENCES "UserPokemonInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
