import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { UserPokemonService } from './user-pokemon.service';
import { PrismaService } from '../prisma/prisma.service';
import { CatalogService } from '../catalog/catalog.service';

describe('UserPokemonService', () => {
  let service: UserPokemonService;
  let prismaService: PrismaService;
  let catalogService: CatalogService;

  const mockPrismaService = {
    userPokemonInstance: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn(),
    },
  };

  const mockCatalogService = {
    getPokemonFormById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserPokemonService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CatalogService,
          useValue: mockCatalogService,
        },
      ],
    }).compile();

    service = module.get<UserPokemonService>(UserPokemonService);
    prismaService = module.get<PrismaService>(PrismaService);
    catalogService = module.get<CatalogService>(CatalogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createInstance', () => {
    const userId = 'user-1';
    const formId = 'form-1';
    const mockForm = {
      id: formId,
      baseAttack: 100,
      baseDefense: 100,
      baseStamina: 100,
      species: {
        name: 'Pikachu',
        primaryType: { name: 'ELECTRIC' },
        secondaryType: null,
      },
    };

    const createDto = {
      formId,
      levelTimes2: 40, // level 20
      ivAtk: 15,
      ivDef: 15,
      ivSta: 15,
      nickname: 'Sparky',
      notes: 'My favorite',
      favorite: true,
    };

    it('should create a Pokemon instance with calculated CP and HP', async () => {
      mockCatalogService.getPokemonFormById.mockResolvedValue(mockForm);
      mockPrismaService.userPokemonInstance.create.mockResolvedValue({
        id: 'instance-1',
        userId,
        ...createDto,
        cp: 1234,
        hp: 100,
        form: mockForm,
      });

      const result = await service.createInstance(userId, createDto);

      expect(mockCatalogService.getPokemonFormById).toHaveBeenCalledWith(formId);
      expect(mockPrismaService.userPokemonInstance.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if form does not exist', async () => {
      mockCatalogService.getPokemonFormById.mockResolvedValue(null);

      await expect(service.createInstance(userId, createDto)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('getUserInstances', () => {
    const userId = 'user-1';

    it('should return user Pokemon instances', async () => {
      const mockInstances = [
        {
          id: 'instance-1',
          userId,
          formId: 'form-1',
          form: { species: { name: 'Pikachu' } },
        },
      ];

      mockPrismaService.userPokemonInstance.findMany.mockResolvedValue(
        mockInstances
      );

      const result = await service.getUserInstances(userId, 0, 50);

      expect(mockPrismaService.userPokemonInstance.findMany).toHaveBeenCalledWith({
        where: { userId },
        skip: 0,
        take: 50,
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockInstances);
    });
  });

  describe('getInstanceById', () => {
    const userId = 'user-1';
    const instanceId = 'instance-1';

    it('should return instance if it belongs to user', async () => {
      const mockInstance = {
        id: instanceId,
        userId,
        formId: 'form-1',
        form: { species: { name: 'Pikachu' } },
      };

      mockPrismaService.userPokemonInstance.findUnique.mockResolvedValue(
        mockInstance
      );

      const result = await service.getInstanceById(userId, instanceId);

      expect(result).toEqual(mockInstance);
    });

    it('should throw NotFoundException if instance does not exist', async () => {
      mockPrismaService.userPokemonInstance.findUnique.mockResolvedValue(null);

      await expect(
        service.getInstanceById(userId, instanceId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if instance belongs to different user', async () => {
      const mockInstance = {
        id: instanceId,
        userId: 'other-user',
        formId: 'form-1',
      };

      mockPrismaService.userPokemonInstance.findUnique.mockResolvedValue(
        mockInstance
      );

      await expect(
        service.getInstanceById(userId, instanceId)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateInstance', () => {
    const userId = 'user-1';
    const instanceId = 'instance-1';
    const mockForm = {
      id: 'form-1',
      baseAttack: 100,
      baseDefense: 100,
      baseStamina: 100,
      species: {
        name: 'Pikachu',
        primaryType: { name: 'ELECTRIC' },
        secondaryType: null,
      },
    };

    const existingInstance = {
      id: instanceId,
      userId,
      formId: 'form-1',
      levelTimes2: 40,
      ivAtk: 15,
      ivDef: 15,
      ivSta: 15,
      cp: 1234,
      hp: 100,
      form: mockForm,
    };

    it('should update instance and recalculate CP/HP when IVs change', async () => {
      mockPrismaService.userPokemonInstance.findUnique.mockResolvedValue(
        existingInstance
      );
      mockCatalogService.getPokemonFormById.mockResolvedValue(mockForm);
      mockPrismaService.userPokemonInstance.update.mockResolvedValue({
        ...existingInstance,
        ivAtk: 14,
        cp: 1220,
      });

      const updateDto = { ivAtk: 14 };

      const result = await service.updateInstance(userId, instanceId, updateDto);

      expect(mockPrismaService.userPokemonInstance.update).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should update instance without recalculating if no stats changed', async () => {
      mockPrismaService.userPokemonInstance.findUnique.mockResolvedValue(
        existingInstance
      );
      mockPrismaService.userPokemonInstance.update.mockResolvedValue({
        ...existingInstance,
        nickname: 'New Name',
      });

      const updateDto = { nickname: 'New Name' };

      const result = await service.updateInstance(userId, instanceId, updateDto);

      expect(mockPrismaService.userPokemonInstance.update).toHaveBeenCalled();
      expect(result.nickname).toBe('New Name');
    });
  });

  describe('deleteInstance', () => {
    const userId = 'user-1';
    const instanceId = 'instance-1';

    it('should delete instance if it belongs to user', async () => {
      const mockInstance = {
        id: instanceId,
        userId,
        formId: 'form-1',
      };

      mockPrismaService.userPokemonInstance.findUnique.mockResolvedValue(
        mockInstance
      );
      mockPrismaService.userPokemonInstance.delete.mockResolvedValue(mockInstance);

      await service.deleteInstance(userId, instanceId);

      expect(mockPrismaService.userPokemonInstance.delete).toHaveBeenCalledWith({
        where: { id: instanceId },
      });
    });
  });

  describe('getCollectionStats', () => {
    const userId = 'user-1';

    it('should return collection statistics', async () => {
      mockPrismaService.userPokemonInstance.count.mockResolvedValue(10);
      mockPrismaService.userPokemonInstance.groupBy.mockResolvedValue([
        { formId: 'form-1' },
        { formId: 'form-2' },
      ]);
      mockPrismaService.userPokemonInstance.aggregate.mockResolvedValue({
        _sum: { cp: 15000 },
      });
      mockPrismaService.userPokemonInstance.count.mockImplementation((args) => {
        if (args?.where?.favorite === true) {
          return Promise.resolve(5);
        }
        return Promise.resolve(10);
      });

      const result = await service.getCollectionStats(userId);

      expect(result).toHaveProperty('totalCount');
      expect(result).toHaveProperty('uniqueSpeciesCount');
      expect(result).toHaveProperty('totalCP');
      expect(result).toHaveProperty('favoriteCount');
    });
  });
});

