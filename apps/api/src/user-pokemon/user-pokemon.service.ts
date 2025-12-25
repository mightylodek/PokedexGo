import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CatalogService } from '../catalog/catalog.service';
import {
  calculateCP,
  calculateHP,
  getDefaultRuleset,
} from '@pokedex-go/battle-engine';
import {
  CreatePokemonInstanceDto,
  UpdatePokemonInstanceDto,
} from '@pokedex-go/shared';

@Injectable()
export class UserPokemonService {
  constructor(
    private prisma: PrismaService,
    private catalogService: CatalogService
  ) {}

  /**
   * Calculate CP and HP for a Pokemon instance
   */
  private async calculateStats(
    formId: string,
    levelTimes2: number,
    ivAtk: number,
    ivDef: number,
    ivSta: number
  ): Promise<{ cp: number; hp: number }> {
    const form = await this.catalogService.getPokemonFormById(formId);

    if (!form) {
      throw new NotFoundException(`Pokemon form ${formId} not found`);
    }

    const level = levelTimes2 / 2; // Convert levelTimes2 to actual level
    const ruleset = getDefaultRuleset();

    const cp = calculateCP(
      form.baseAttack,
      form.baseDefense,
      form.baseStamina,
      ivAtk,
      ivDef,
      ivSta,
      level,
      ruleset
    );

    const hp = calculateHP(form.baseStamina, ivSta, level, ruleset);

    return { cp, hp };
  }

  /**
   * Create a new Pokemon instance for a user
   */
  async createInstance(
    userId: string,
    dto: CreatePokemonInstanceDto
  ): Promise<any> {
    // Verify form exists
    const form = await this.catalogService.getPokemonFormById(dto.formId);
    if (!form) {
      throw new NotFoundException(`Pokemon form ${dto.formId} not found`);
    }

    // Calculate CP and HP
    const { cp, hp } = await this.calculateStats(
      dto.formId,
      dto.levelTimes2,
      dto.ivAtk,
      dto.ivDef,
      dto.ivSta
    );

    // Create the instance
    const instance = await this.prisma.userPokemonInstance.create({
      data: {
        userId,
        formId: dto.formId,
        nickname: dto.nickname,
        levelTimes2: dto.levelTimes2,
        ivAtk: dto.ivAtk,
        ivDef: dto.ivDef,
        ivSta: dto.ivSta,
        cp,
        hp,
        notes: dto.notes,
        favorite: dto.favorite || false,
      },
      include: {
        form: {
          include: {
            species: {
              include: {
                primaryType: true,
                secondaryType: true,
              },
            },
          },
        },
      },
    });

    return instance;
  }

  /**
   * Get all Pokemon instances for a user
   */
  async getUserInstances(userId: string, skip = 0, take = 50): Promise<any> {
    const instances = await this.prisma.userPokemonInstance.findMany({
      where: { userId },
      skip,
      take,
      include: {
        form: {
          include: {
            species: {
              include: {
                primaryType: true,
                secondaryType: true,
              },
            },
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return instances;
  }

  /**
   * Get a specific Pokemon instance
   */
  async getInstanceById(
    userId: string,
    instanceId: string
  ): Promise<any> {
    const instance = await this.prisma.userPokemonInstance.findUnique({
      where: { id: instanceId },
      include: {
        form: {
          include: {
            species: {
              include: {
                primaryType: true,
                secondaryType: true,
              },
            },
            moves: {
              include: {
                move: {
                  include: {
                    type: true,
                  },
                },
              },
            },
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!instance) {
      throw new NotFoundException(
        `Pokemon instance ${instanceId} not found`
      );
    }

    // Ensure the instance belongs to the user
    if (instance.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this Pokemon instance'
      );
    }

    return instance;
  }

  /**
   * Update a Pokemon instance
   */
  async updateInstance(
    userId: string,
    instanceId: string,
    dto: UpdatePokemonInstanceDto
  ): Promise<any> {
    // Verify instance exists and belongs to user
    const existing = await this.getInstanceById(userId, instanceId);

    // If level or IVs are being updated, recalculate CP and HP
    let cp = existing.cp;
    let hp = existing.hp;

    if (
      dto.levelTimes2 !== undefined ||
      dto.ivAtk !== undefined ||
      dto.ivDef !== undefined ||
      dto.ivSta !== undefined
    ) {
      const levelTimes2 =
        dto.levelTimes2 !== undefined
          ? dto.levelTimes2
          : existing.levelTimes2;
      const ivAtk = dto.ivAtk !== undefined ? dto.ivAtk : existing.ivAtk;
      const ivDef = dto.ivDef !== undefined ? dto.ivDef : existing.ivDef;
      const ivSta = dto.ivSta !== undefined ? dto.ivSta : existing.ivSta;

      const stats = await this.calculateStats(
        existing.formId,
        levelTimes2,
        ivAtk,
        ivDef,
        ivSta
      );
      cp = stats.cp;
      hp = stats.hp;
    }

    // Update the instance
    const updated = await this.prisma.userPokemonInstance.update({
      where: { id: instanceId },
      data: {
        ...(dto.nickname !== undefined && { nickname: dto.nickname }),
        ...(dto.levelTimes2 !== undefined && { levelTimes2: dto.levelTimes2 }),
        ...(dto.ivAtk !== undefined && { ivAtk: dto.ivAtk }),
        ...(dto.ivDef !== undefined && { ivDef: dto.ivDef }),
        ...(dto.ivSta !== undefined && { ivSta: dto.ivSta }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.favorite !== undefined && { favorite: dto.favorite }),
        cp,
        hp,
      },
      include: {
        form: {
          include: {
            species: {
              include: {
                primaryType: true,
                secondaryType: true,
              },
            },
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Delete a Pokemon instance
   */
  async deleteInstance(userId: string, instanceId: string): Promise<void> {
    // Verify instance exists and belongs to user
    await this.getInstanceById(userId, instanceId);

    // Delete the instance (tags will be cascade deleted)
    await this.prisma.userPokemonInstance.delete({
      where: { id: instanceId },
    });
  }

  /**
   * Get statistics for a user's collection
   */
  async getCollectionStats(userId: string): Promise<any> {
    const [totalCount, uniqueSpecies, totalCP, favoriteCount] =
      await Promise.all([
        this.prisma.userPokemonInstance.count({
          where: { userId },
        }),
        this.prisma.userPokemonInstance.groupBy({
          by: ['formId'],
          where: { userId },
          _count: true,
        }),
        this.prisma.userPokemonInstance.aggregate({
          where: { userId },
          _sum: { cp: true },
        }),
        this.prisma.userPokemonInstance.count({
          where: { userId, favorite: true },
        }),
      ]);

    return {
      totalCount,
      uniqueSpeciesCount: uniqueSpecies.length,
      totalCP: totalCP._sum.cp || 0,
      favoriteCount,
    };
  }
}

