import { Test, TestingModule } from '@nestjs/testing';
import { UserPokemonController } from './user-pokemon.controller';
import { UserPokemonService } from './user-pokemon.service';

describe('UserPokemonController', () => {
  let controller: UserPokemonController;
  let service: UserPokemonService;

  const mockService = {
    createInstance: jest.fn(),
    getUserInstances: jest.fn(),
    getInstanceById: jest.fn(),
    updateInstance: jest.fn(),
    deleteInstance: jest.fn(),
    getCollectionStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserPokemonController],
      providers: [
        {
          provide: UserPokemonService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<UserPokemonController>(UserPokemonController);
    service = module.get<UserPokemonService>(UserPokemonService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createInstance', () => {
    it('should call service.createInstance with user id and dto', async () => {
      const req = { user: { id: 'user-1' } };
      const dto = {
        formId: 'form-1',
        levelTimes2: 40,
        ivAtk: 15,
        ivDef: 15,
        ivSta: 15,
      };
      const expectedResult = { id: 'instance-1', ...dto };

      mockService.createInstance.mockResolvedValue(expectedResult);

      const result = await controller.createInstance(req as any, dto);

      expect(service.createInstance).toHaveBeenCalledWith('user-1', dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getUserInstances', () => {
    it('should call service.getUserInstances with pagination', async () => {
      const req = { user: { id: 'user-1' } };
      const expectedResult = [{ id: 'instance-1' }];

      mockService.getUserInstances.mockResolvedValue(expectedResult);

      const result = await controller.getUserInstances(req as any, '0', '10');

      expect(service.getUserInstances).toHaveBeenCalledWith('user-1', 0, 10);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getInstanceById', () => {
    it('should call service.getInstanceById', async () => {
      const req = { user: { id: 'user-1' } };
      const instanceId = 'instance-1';
      const expectedResult = { id: instanceId };

      mockService.getInstanceById.mockResolvedValue(expectedResult);

      const result = await controller.getInstanceById(req as any, instanceId);

      expect(service.getInstanceById).toHaveBeenCalledWith('user-1', instanceId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('updateInstance', () => {
    it('should call service.updateInstance', async () => {
      const req = { user: { id: 'user-1' } };
      const instanceId = 'instance-1';
      const dto = { nickname: 'New Name' };
      const expectedResult = { id: instanceId, ...dto };

      mockService.updateInstance.mockResolvedValue(expectedResult);

      const result = await controller.updateInstance(
        req as any,
        instanceId,
        dto
      );

      expect(service.updateInstance).toHaveBeenCalledWith(
        'user-1',
        instanceId,
        dto
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('deleteInstance', () => {
    it('should call service.deleteInstance and return success message', async () => {
      const req = { user: { id: 'user-1' } };
      const instanceId = 'instance-1';

      mockService.deleteInstance.mockResolvedValue(undefined);

      const result = await controller.deleteInstance(req as any, instanceId);

      expect(service.deleteInstance).toHaveBeenCalledWith('user-1', instanceId);
      expect(result).toEqual({
        message: 'Pokemon instance deleted successfully',
      });
    });
  });

  describe('getCollectionStats', () => {
    it('should call service.getCollectionStats', async () => {
      const req = { user: { id: 'user-1' } };
      const expectedResult = {
        totalCount: 10,
        uniqueSpeciesCount: 5,
        totalCP: 15000,
        favoriteCount: 3,
      };

      mockService.getCollectionStats.mockResolvedValue(expectedResult);

      const result = await controller.getCollectionStats(req as any);

      expect(service.getCollectionStats).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(expectedResult);
    });
  });
});

