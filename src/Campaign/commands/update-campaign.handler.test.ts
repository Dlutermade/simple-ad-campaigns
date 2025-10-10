import { TestingModule, Test } from '@nestjs/testing';
import { campaignsTable } from '@src/db/schema';
import { DRIZZLE_PROVIDER } from '@src/libs/drizzle.module';
import { CampaignRepository } from '../repository/campaign.repository';
import { UpdateCampaignHandler } from './update-campaign.handler';

describe('UpdateCampaignHandler', () => {
  let handler: UpdateCampaignHandler;
  let campaignRepository: CampaignRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateCampaignHandler,
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
              }),
            ),
          },
        },
      ],
    }).compile();

    handler = module.get<UpdateCampaignHandler>(UpdateCampaignHandler);
    campaignRepository = module.get<CampaignRepository>(CampaignRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });
});
