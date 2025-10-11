import { Test, TestingModule } from '@nestjs/testing';
import { AdSetRepository } from '../repository/ad-set.repository';
import { CampaignRepository } from '../repository/campaign.repository';
import { AdjustCampaignBudgetHandler } from './adjust-campaign-budget.handler';
import { campaignsTable } from '@src/db/schema';
import { DRIZZLE_PROVIDER } from '@src/libs/drizzle.module';
import { AdjustCampaignBudgetCommand } from './adjust-campaign-budget.command';

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

  it(`GIVEN:
  No campaign with id 1 exists in the database
WHEN:
    I attempt to adjust the budget of the campaign
THEN:
    a NotFoundException should be thrown`, async () => {
    vitest
      .spyOn(campaignRepository, 'findById')
      .mockResolvedValueOnce(undefined);

    const command = new AdjustCampaignBudgetCommand('1', 2000, 1);

    await expect(handler.execute(command)).rejects.toMatchObject({
      response: { errorCode: 'CAMPAIGN_NOT_FOUND' },
      name: 'NotFoundException',
    });
  });

  it(`GIVEN:
    a campaign with id 1 and status 'Deleted' exists in the database
WHEN:
    I attempt to adjust the budget of the campaign
THEN:
    a ConflictException should be thrown`, async () => {
    vitest.spyOn(campaignRepository, 'findById').mockResolvedValueOnce({
      id: 'deleted-campaign-id',
      name: 'Deleted Campaign',
      budget: 1000,
      status: 'Deleted',
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const command = new AdjustCampaignBudgetCommand(
      'deleted-campaign-id',
      2000,
      1,
    );

    await expect(handler.execute(command)).rejects.toMatchObject({
      response: { errorCode: 'CAMPAIGN_DELETED' },
      name: 'ConflictException',
    });
  });

  it(`GIVEN:
    a campaign with id 1 and status 'Paused' and version 2 exists in the database
WHEN:
    the campaign version does not match the command version
THEN:
    a ConflictException should be thrown`, async () => {
    vitest.spyOn(campaignRepository, 'findById').mockResolvedValueOnce({
      id: '1',
      name: 'Test Campaign',
      budget: 1000,
      status: 'Paused',
      version: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const command = new AdjustCampaignBudgetCommand('1', 2000, 1);

    await expect(handler.execute(command)).rejects.toMatchObject({
      response: { errorCode: 'CAMPAIGN_VERSION_MISMATCH' },
      name: 'ConflictException',
    });
  });

  it(`GIVEN:
    a campaign with id 1 and status 'Active' And Budget 1000 exists and version 1 in the database
AND:
    AdSets
    id | campaignId | name   | budget   | status 
    ---|------------|--------|----------|--------
    1 | 1          | Ad Set 1 | 900    | Active
WHEN:
    I add a budget of -200 to the campaign with version 1
THEN:
    a ConflictException should be thrown`, async () => {
    vitest.spyOn(campaignRepository, 'findById').mockResolvedValueOnce({
      id: '1',
      name: 'Test Campaign',
      budget: 1000,
      status: 'Active',
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vitest
      .spyOn(adSetRepository, 'findManyByCampaignId')
      .mockResolvedValueOnce([
        {
          id: '1',
          campaignId: '1',
          name: 'Ad Set 1',
          budget: 900,
          status: 'Active',
        },
      ]);

    const command = new AdjustCampaignBudgetCommand('1', -200, 1);

    await expect(handler.execute(command)).rejects.toMatchObject({
      response: {
        errorCode: 'CAMPAIGN_BUDGET_LESS_THAN_ACTIVE_ADSETS_TOTAL_BUDGET',
      },
      name: 'ConflictException',
    });
  });

  it(`GIVEN:
    a campaign with id 1 and status 'Active' And Budget 1000 exists and version 1 in the database
AND:
    AdSets
    id | campaignId | name   | budget   | status
    ---|------------|--------|----------|--------
    1 | 1          | Ad Set 1 | 900    | Active
WHEN:
    I add a budget of 200 to the campaign with version 1
THEN:
    the campaign budget should be updated to 1200`, async () => {
    vitest.spyOn(campaignRepository, 'findById').mockResolvedValueOnce({
      id: '1',
      name: 'Test Campaign',
      budget: 1000,
      status: 'Active',
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vitest
      .spyOn(adSetRepository, 'findManyByCampaignId')
      .mockResolvedValueOnce([
        {
          id: '1',
          campaignId: '1',
          name: 'Ad Set 1',
          budget: 900,
          status: 'Active',
        },
      ]);

    const command = new AdjustCampaignBudgetCommand('1', 200, 1);

    const result = await handler.execute(command);

    expect(result).toMatchObject({
      id: '1',
      budget: 1200,
    });
  });
});
