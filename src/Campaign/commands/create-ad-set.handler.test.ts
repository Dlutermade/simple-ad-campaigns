import { Test, TestingModule } from '@nestjs/testing';
import { CreateAdSetHandler } from './create-ad-set.handler';

import { AdSetRepository } from '../repository/ad-set.repository';
import { CreateAdSetCommand } from './create-ad-set.command';
import { CampaignRepository } from '../repository/campaign.repository';
import { DRIZZLE_PROVIDER } from '@src/libs/drizzle.module';

describe('CreateAdSetHandler', () => {
  let handler: CreateAdSetHandler;
  let campaignRepository: CampaignRepository;
  let adSetRepository: AdSetRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateAdSetHandler,
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
            create: vitest
              .fn()
              .mockImplementation(
                (data: {
                  campaignId: string;
                  name: string;
                  budget: number;
                }) => ({
                  id: '1',
                  campaignId: data.campaignId,
                  name: data.name,
                  budget: data.budget,
                  status: 'Paused',
                }),
              ),
          },
        },
      ],
    }).compile();

    handler = module.get<CreateAdSetHandler>(CreateAdSetHandler);
    campaignRepository = module.get<CampaignRepository>(CampaignRepository);
    adSetRepository = module.get<AdSetRepository>(AdSetRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should create an ad set', async () => {
    const command = new CreateAdSetCommand('1', 'Test Ad Set', 500);

    const expectedAdSet = {
      id: '1',
      campaignId: '1',
      name: 'Test Ad Set',
      budget: 500,
      status: 'Paused',
    };

    const result = await handler.execute(command);

    expect(result).toEqual(expectedAdSet);
  });

  it('should throw NotFoundException if campaign does not exist', async () => {
    vitest
      .spyOn(campaignRepository, 'findById')
      .mockResolvedValueOnce(undefined);

    const command = new CreateAdSetCommand('999', 'Test Ad Set', 500);

    await expect(handler.execute(command)).rejects.toMatchObject({
      response: {
        errorCode: 'CAMPAIGN_NOT_FOUND',
        campaignId: '999',
      },
    });
  });

  it('should throw ConflictException if max ad sets reached', async () => {
    vitest.spyOn(adSetRepository, 'findManyByCampaignId').mockResolvedValueOnce(
      new Array(10).map((_, i) => ({
        id: `${i + 1}`,
        campaignId: '1',
        name: `Ad Set ${i + 1}`,
        budget: 100,
        status: 'Paused',
      })),
    );

    const command = new CreateAdSetCommand('1', 'Test Ad Set', 500);

    await expect(handler.execute(command)).rejects.toMatchObject({
      response: {
        errorCode: 'MAX_AD_SETS_REACHED',
        campaignId: '1',
        maxAdSets: 10,
      },
    });
  });

  it('should create an ad set successfully', async () => {
    const command = new CreateAdSetCommand('1', 'New Ad Set', 300);

    const result = await handler.execute(command);

    expect(result).toEqual({
      id: '1',
      campaignId: '1',
      name: 'New Ad Set',
      budget: 300,
      status: 'Paused',
    });
  });
});
