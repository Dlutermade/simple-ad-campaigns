/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { DeleteAdHandler } from './delete-ad.handler';

import { AdSetRepository } from '../repository/ad-set.repository';
import { DeleteAdCommand } from './delete-ad.command';
import { CampaignRepository } from '../repository/campaign.repository';
import { DRIZZLE_PROVIDER } from '@src/libs/drizzle.module';
import { AdRepository } from '../repository/ad.repository';

describe('DeleteAdHandler', () => {
  let handler: DeleteAdHandler;
  let campaignRepository: CampaignRepository;
  let adSetRepository: AdSetRepository;
  let adRepository: AdRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteAdHandler,
        {
          provide: DRIZZLE_PROVIDER,
          useValue: {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return
            transaction: vitest.fn().mockImplementation((cb) => cb(null)),
          },
        },
        {
          provide: CampaignRepository,
          useValue: {
            findById: vitest.fn().mockResolvedValue({
              id: '1',
              name: 'Test Campaign',
              budget: 1000,
              status: 'Active',
              version: 1,
            }),
          },
        },
        {
          provide: AdSetRepository,
          useValue: {
            findById: vitest.fn().mockResolvedValue({
              id: '1',
              campaignId: '1',
              name: 'Test Ad Set',
              budget: 500,
              status: 'Active',
              version: 1,
            }),
          },
        },
        {
          provide: AdRepository,
          useValue: {
            findById: vitest.fn().mockResolvedValue({
              id: '1',
              adSetId: '1',
              name: 'Test Ad',
              content: 'Ad Content',
              creative: 'Ad Creative',
              status: 'Active',
            }),
            findManyByAdSetId: vitest.fn().mockResolvedValue([]),
            update: vitest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    handler = module.get<DeleteAdHandler>(DeleteAdHandler);
    campaignRepository = module.get<CampaignRepository>(CampaignRepository);
    adSetRepository = module.get<AdSetRepository>(AdSetRepository);
    adRepository = module.get<AdRepository>(AdRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  // Additional tests would go here
  it('should delete an ad', async () => {
    vitest.spyOn(adRepository, 'findManyByAdSetId').mockResolvedValueOnce([
      {
        id: '2',
        adSetId: '1',
        name: 'Test Ad',
        content: 'Ad Content',
        creative: 'Ad Creative',
        status: 'Active',
      },
    ]);
    const command = new DeleteAdCommand('1', '1', '1', 1);

    await expect(handler.execute(command)).resolves.toBeUndefined();

    expect(campaignRepository.findById).toHaveBeenCalledExactlyOnceWith('1', {
      txClient: null,
      lock: { strength: 'update' },
    });
    expect(adSetRepository.findById).toHaveBeenCalledExactlyOnceWith('1', {
      txClient: null,
      lock: { strength: 'update' },
    });
    expect(adRepository.findById).toHaveBeenCalledExactlyOnceWith('1', {
      txClient: null,
      lock: { strength: 'update' },
    });
    expect(adRepository.update).toHaveBeenCalledExactlyOnceWith(
      '1',
      { status: 'Deleted' },
      { txClient: null },
    );
  });

  it('should throw NotFoundException if ad does not exist', async () => {
    const command = new DeleteAdCommand('1', '1', '1', 1);

    vitest.spyOn(adRepository, 'findById').mockResolvedValueOnce(undefined);

    await expect(handler.execute(command)).rejects.toMatchObject({
      response: {
        errorCode: 'AD_NOT_FOUND',
        adId: '1',
      },
    });
  });

  it('should throw ConflictException if ad is already deleted', async () => {
    const command = new DeleteAdCommand('1', '1', '1', 1);

    vitest.spyOn(adRepository, 'findById').mockResolvedValueOnce({
      id: '1',
      adSetId: '1',
      name: 'Test Ad',
      content: 'Ad Content',
      creative: 'Ad Creative',
      status: 'Deleted',
    });
    await expect(handler.execute(command)).rejects.toMatchObject({
      response: {
        errorCode: 'AD_DELETED',
        adId: '1',
      },
    });
  });

  it('should throw ConflictException if deleting the ad would violate minimum ad requirement', async () => {
    const command = new DeleteAdCommand('1', '1', '1', 1);

    vitest.spyOn(adRepository, 'findManyByAdSetId').mockResolvedValueOnce([
      {
        id: '1',
        adSetId: '1',
        name: 'Test Ad',
        content: 'Ad Content',
        creative: 'Ad Creative',
        status: 'Active',
      },
    ]);

    await expect(handler.execute(command)).rejects.toMatchObject({
      response: {
        errorCode: 'CANNOT_DELETE_ONLY_ACTIVE_AD',
        adSetId: '1',
      },
    });
  });
});
