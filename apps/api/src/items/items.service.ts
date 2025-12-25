import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ItemType } from '@prisma/client';

@Injectable()
export class ItemsService {
  constructor(private prisma: PrismaService) {}

  async getItems(skip = 0, take = 50, type?: ItemType) {
    const where = type ? { type } : {};
    return this.prisma.item.findMany({
      skip,
      take,
      where,
      orderBy: {
        name: 'asc',
      },
    });
  }

  async getItemById(id: string) {
    return this.prisma.item.findUnique({
      where: { id },
    });
  }

  async getItemByKey(itemKey: string) {
    return this.prisma.item.findUnique({
      where: { itemKey },
    });
  }

  async getItemsByType(type: ItemType) {
    return this.prisma.item.findMany({
      where: { type },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async getItemTypes() {
    // Return all available item types
    return Object.values(ItemType);
  }

  async getStats() {
    const [totalItems, itemsByType] = await Promise.all([
      this.prisma.item.count(),
      this.prisma.item.groupBy({
        by: ['type'],
        _count: {
          type: true,
        },
      }),
    ]);

    const typeCounts: Record<string, number> = {};
    itemsByType.forEach((group) => {
      typeCounts[group.type] = group._count.type;
    });

    return {
      total: totalItems,
      byType: typeCounts,
    };
  }
}

