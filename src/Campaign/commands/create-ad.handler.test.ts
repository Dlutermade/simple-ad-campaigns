import { Test, TestingModule } from '@nestjs/testing';
import { CreateAdHandler } from './create-ad.handler';

import { AdSetRepository } from '../repository/ad-set.repository';
import { CreateAdCommand } from './create-ad.command';
import { CampaignRepository } from '../repository/campaign.repository';
import { DRIZZLE_PROVIDER } from '@src/libs/drizzle.module';
import { MAXIMUM_AD_PER_CAMPAIGN } from '@src/constants/ad.constants';
import { AdRepository } from '../repository/ad.repository';

describe('CreateAdHandler', () => {
  let handler: CreateAdHandler;
  let campaignRepository: CampaignRepository;
  let adSetRepository: AdSetRepository;
  let adRepository: AdRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateAdHandler,
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
            create: vitest
              .fn()
              .mockImplementation(
                (data: {
                  name: string;
                  adSetId: string;
                  content: string;
                  creative: string;
                }) => ({
                  id: '1',
                  ...data,
                  status: 'Paused',
                }),
              ),
            findManyByAdSetId: vitest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    handler = module.get<CreateAdHandler>(CreateAdHandler);
    campaignRepository = module.get<CampaignRepository>(CampaignRepository);
    adSetRepository = module.get<AdSetRepository>(AdSetRepository);
    adRepository = module.get<AdRepository>(AdRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should create an ad', async () => {
    const command = new CreateAdCommand(
      '1',
      '1',
      'Test Ad',
      'This is a test ad content',
      'CreativeData',
      1,
    );

    const expectedAd = {
      id: '1',
      name: 'Test Ad',
      adSetId: '1',
      content: 'This is a test ad content',
      creative: 'CreativeData',
      status: 'Paused',
    };

    const result = await handler.execute(command);

    expect(result).toEqual(expectedAd);
  });

  it('should throw NotFoundException if campaign does not exist', async () => {
    vitest
      .spyOn(campaignRepository, 'findById')
      .mockResolvedValueOnce(undefined);

    const command = new CreateAdCommand(
      '1',
      '1',
      'Test Ad',
      'This is a test ad content',
      'CreativeData',
      1,
    );

    await expect(handler.execute(command)).rejects.toMatchObject({
      response: {
        errorCode: 'CAMPAIGN_NOT_FOUND',
        campaignId: '1',
      },
    });
  });

  it('should throw NotFoundException if ad set does not exist', async () => {
    vitest.spyOn(adSetRepository, 'findById').mockResolvedValueOnce(undefined);

    const command = new CreateAdCommand(
      '1',
      '999',
      'Test Ad',
      'This is a test ad content',
      'CreativeData',
      1,
    );

    await expect(handler.execute(command)).rejects.toMatchObject({
      response: {
        errorCode: 'AD_SET_NOT_FOUND',
        adSetId: '999',
      },
    });
  });

  it('should throw ConflictException if ad set does not belong to campaign', async () => {
    vitest.spyOn(adSetRepository, 'findById').mockResolvedValueOnce({
      id: '1',
      campaignId: '2',
      name: 'Test Ad Set',
      budget: 500,
      status: 'Active',
    });

    const command = new CreateAdCommand(
      '1',
      '1',
      'Test Ad',
      'This is a test ad content',
      'CreativeData',
      1,
    );

    await expect(handler.execute(command)).rejects.toMatchObject({
      response: {
        errorCode: 'AD_SET_CAMPAIGN_MISMATCH',
        adSetId: '1',
        campaignId: '1',
      },
    });
  });

  it('should throw ConflictException if max ads reached', async () => {
    vitest.spyOn(adRepository, 'findManyByAdSetId').mockResolvedValueOnce(
      new Array(MAXIMUM_AD_PER_CAMPAIGN).map((_, i) => ({
        id: `${i + 1}`,
        name: `Ad ${i + 1}`,
        adSetId: '1',
        content: 'Ad Content',
        creative: 'CreativeData',
        status: 'Paused',
      })),
    );

    const command = new CreateAdCommand(
      '1',
      '1',
      'Test Ad',
      'This is a test ad content',
      'CreativeData',
      1,
    );

    await expect(handler.execute(command)).rejects.toMatchObject({
      response: {
        errorCode: 'MAX_ADS_REACHED',
        adSetId: '1',
        adCount: MAXIMUM_AD_PER_CAMPAIGN,
        maximumAllowed: MAXIMUM_AD_PER_CAMPAIGN,
      },
    });
  });
});
