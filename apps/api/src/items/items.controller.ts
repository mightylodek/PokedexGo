import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { ItemsService } from './items.service';
import { ItemType } from '@prisma/client';

@Controller('items')
export class ItemsController {
  constructor(private itemsService: ItemsService) {}

  @Get()
  async getItems(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('type') type?: string
  ) {
    const itemType = type && Object.values(ItemType).includes(type as ItemType) 
      ? (type as ItemType) 
      : undefined;
    
    return this.itemsService.getItems(
      skip ? parseInt(skip, 10) : 0,
      take ? parseInt(take, 10) : 50,
      itemType
    );
  }

  @Get('stats')
  async getStats() {
    return this.itemsService.getStats();
  }

  @Get('types')
  async getItemTypes() {
    return this.itemsService.getItemTypes();
  }

  @Get(':id')
  async getItemById(@Param('id') id: string) {
    const item = await this.itemsService.getItemById(id);
    if (!item) {
      throw new NotFoundException(`Item not found: ${id}`);
    }
    return item;
  }

  @Get('key/:key')
  async getItemByKey(@Param('key') key: string) {
    const item = await this.itemsService.getItemByKey(key);
    if (!item) {
      throw new NotFoundException(`Item not found with key: ${key}`);
    }
    return item;
  }

  @Get('type/:type')
  async getItemsByType(@Param('type') type: string) {
    if (!Object.values(ItemType).includes(type as ItemType)) {
      throw new NotFoundException(`Invalid item type: ${type}`);
    }
    return this.itemsService.getItemsByType(type as ItemType);
  }
}

