/* eslint-disable @typescript-eslint/unbound-method */
import { TestingModule, Test } from '@nestjs/testing';
import { DRIZZLE_PROVIDER } from '@src/libs/drizzle.module';
import { AdSetRepository } from '../repository/ad-set.repository';
import { CampaignRepository } from '../repository/campaign.repository';
import { DeleteAdSetHandler } from './delete-ad-set.handler';
import { DeleteAdSetCommand } from './delete-ad-set.command';

describe('DeleteAdSetHandler', () => {
  let handler: DeleteAdSetHandler;
  let campaignRepository: CampaignRepository;
  let adSetRepository: AdSetRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteAdSetHandler,
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
            findManyByCampaignId: vitest.fn().mockResolvedValue([]),
            update: vitest
              .fn()
              .mockImplementation(
                (
                  adSetId: string,
                  { status }: { status: 'Active' | 'Paused' | 'Deleted' },
                ) => ({
                  id: adSetId,
                  campaignId: '1',
                  name: 'Test Ad Set',
                  budget: 500,
                  status,
                }),
              ),
            findById: vitest.fn().mockResolvedValue({
              id: '1',
              campaignId: '1',
              name: 'Test Ad Set',
              budget: 500,
              status: 'Paused',
            }),
          },
        },
      ],
    }).compile();

    handler = module.get<DeleteAdSetHandler>(DeleteAdSetHandler);
    campaignRepository = module.get<CampaignRepository>(CampaignRepository);
    adSetRepository = module.get<AdSetRepository>(AdSetRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should delete an ad paused set', async () => {
    const command = new DeleteAdSetCommand('1', '1', 1);

    await handler.execute(command);

    expect(campaignRepository.findById).toHaveBeenCalledExactlyOnceWith('1', {
      lock: { strength: 'update' },
      txClient: null,
    });
    expect(adSetRepository.findById).toHaveBeenCalledExactlyOnceWith('1', {
      lock: { strength: 'update' },
      txClient: null,
    });
    expect(adSetRepository.update).toHaveBeenCalledExactlyOnceWith(
      '1',
      {
        status: 'Deleted',
      },
      {
        txClient: null,
      },
    );
  });

  it('should delete an ad active set', async () => {
    vitest.spyOn(adSetRepository, 'findManyByCampaignId').mockResolvedValue([
      {
        id: '1',
        campaignId: '1',
        name: 'Test Ad Set',
        budget: 500,
        status: 'Active',
      },
    ]);

    const command = new DeleteAdSetCommand('1', '1', 1);

    await handler.execute(command);

    expect(adSetRepository.update).toHaveBeenCalledExactlyOnceWith(
      '1',
      {
        status: 'Deleted',
      },
      {
        txClient: null,
      },
    );
  });

  it('should throw ConflictException when trying to delete an active ad set', async () => {
    vitest.spyOn(adSetRepository, 'findById').mockResolvedValue({
      id: '1',
      campaignId: '1',
      name: 'Test Ad Set',
      budget: 500,
      status: 'Active',
    });

    const command = new DeleteAdSetCommand('1', '1', 1);

    await expect(handler.execute(command)).rejects.toMatchObject({
      status: 409,
      response: {
        errorCode: 'CANNOT_DELETE_ONLY_ACTIVE_AD_SET',
        adSetId: '1',
      },
    });
  });

  it('should throw ConflictException when trying to delete an deleted ad set', async () => {
    vitest.spyOn(adSetRepository, 'findById').mockResolvedValue({
      id: '1',
      campaignId: '1',
      name: 'Test Ad Set',
      budget: 500,
      status: 'Deleted',
    });

    const command = new DeleteAdSetCommand('1', '1', 1);

    await expect(handler.execute(command)).rejects.toMatchObject({
      status: 409,
      response: {
        errorCode: 'AD_SET_ALREADY_DELETED',
        adSetId: '1',
      },
    });
  });
});
