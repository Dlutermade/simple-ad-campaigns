import { Test, TestingModule } from '@nestjs/testing';
import { AdSetRepository } from '../repository/ad-set.repository';
import { CampaignRepository } from '../repository/campaign.repository';
import { AdjustCampaignBudgetHandler } from './adjust-campaign-budget.handler';
import { campaignsTable } from '@src/db/schema';
import { DRIZZLE_PROVIDER } from '@src/libs/drizzle.module';

describe('AdjustCampaignBudgetHandler', () => {
  let handler: AdjustCampaignBudgetHandler;
  let campaignRepository: CampaignRepository;
  let adSetRepository: AdSetRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdjustCampaignBudgetHandler,
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
            findById: vitest.fn(),
            update: vitest.fn(
              (
                id: string,
                data: Pick<typeof campaignsTable.$inferSelect, 'version'> &
                  Partial<
                    Pick<
                      typeof campaignsTable.$inferSelect,
                      'name' | 'budget' | 'status'
                    >
                  >,
              ) => ({
                id,
                ...data,
                version: data.version + 1,
                name: 'Test Campaign',
                budget: 1000,
                createdAt: new Date(),
                updatedAt: new Date(),
              }),
            ),
          },
        },
        {
          provide: AdSetRepository,
          useValue: {
            findManyByCampaignId: vitest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    handler = module.get<AdjustCampaignBudgetHandler>(
      AdjustCampaignBudgetHandler,
    );
    campaignRepository = module.get<CampaignRepository>(CampaignRepository);
    adSetRepository = module.get<AdSetRepository>(AdSetRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });
});
