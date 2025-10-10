import { Test, TestingModule } from '@nestjs/testing';
import { SwitchCampaignStatusHandler } from './switch-campaign-status.handler';
import { CampaignRepository } from '../repository/campaign.repository';
import { SwitchCampaignStatusCommand } from './switch-campaign-status.command';
import { campaignsTable } from '@src/db/schema';
import { DRIZZLE_PROVIDER } from '@src/libs/drizzle.module';
import { AdSetRepository } from '../repository/ad-set.repository';

describe('SwitchCampaignStatusHandler', () => {
  let handler: SwitchCampaignStatusHandler;
  let campaignRepository: CampaignRepository;
  let adSetRepository: AdSetRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SwitchCampaignStatusHandler,
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

    handler = module.get<SwitchCampaignStatusHandler>(
      SwitchCampaignStatusHandler,
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
    I attempt to switch the campaign status to 'Active'
THEN:
    a NotFoundException should be thrown`, async () => {
    vitest.spyOn(campaignRepository, 'findById').mockResolvedValue(undefined);

    const command = new SwitchCampaignStatusCommand('1', 'Active', 1);

    await expect(handler.execute(command)).rejects.toMatchObject({
      response: { errorCode: 'CAMPAIGN_NOT_FOUND' },
      name: 'NotFoundException',
    });
  });

  it(`GIVEN:
    a campaign with id 1 and status 'Deleted' exists in the database
WHEN:
    I attempt to switch the campaign status to 'Active'
THEN:
    a ConflictException should be thrown`, async () => {
    vitest.spyOn(campaignRepository, 'findById').mockResolvedValue({
      id: '1',
      name: 'Test Campaign',
      budget: 1000,
      status: 'Deleted',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    });

    const command = new SwitchCampaignStatusCommand('1', 'Active', 1);

    await expect(handler.execute(command)).rejects.toMatchObject({
      response: { errorCode: 'CAMPAIGN_DELETED' },
      name: 'ConflictException',
    });
  });

  it(`GIVEN:
    a campaign with id 1 and status 'Paused' and version 2 exists in the database
WHEN:
    I attempt to switch the campaign status to 'Active' with version 1
THEN:
    a ConflictException should be thrown`, async () => {
    vitest.spyOn(campaignRepository, 'findById').mockResolvedValue({
      id: '1',
      name: 'Test Campaign',
      budget: 1000,
      status: 'Paused',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 2,
    });

    const command = new SwitchCampaignStatusCommand('1', 'Active', 1);

    await expect(handler.execute(command)).rejects.toMatchObject({
      response: { errorCode: 'CAMPAIGN_VERSION_MISMATCH' },
      name: 'ConflictException',
    });
  });

  it(`GIVEN:
    a campaign with id 1 and status 'Paused' exists in the database
WHEN:
    I attempt to switch the campaign status to 'Paused'
THEN:
    a ConflictException should be thrown`, async () => {
    vitest.spyOn(campaignRepository, 'findById').mockResolvedValue({
      id: '1',
      name: 'Test Campaign',
      budget: 1000,
      status: 'Paused',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    });

    const command = new SwitchCampaignStatusCommand('1', 'Paused', 1);

    await expect(handler.execute(command)).rejects.toMatchObject({
      response: { errorCode: 'CAMPAIGN_STATUS_UNCHANGED' },
      name: 'ConflictException',
    });
  });

  it(`GIVEN:
    a campaign with id 1 and status 'Paused' and version 1 and budget 1000 exists in the database
AND:
    AdSets
    id | campaignId | name   | budget   | status 
    ---|------------|--------|----------|--------
    1 | 1          | Ad Set 1 | 100    | Active
    2 | 1          | Ad Set 2 | 300    | Paused
    3 | 1          | Ad Set 2 | 100    | Active
    4 | 1          | Ad Set 2 | 100    | Active
WHEN:
    I attempt to switch the campaign status to 'Active' with version 1
THEN:
    the campaign status should be updated to 'Active'`, async () => {
    vitest.spyOn(campaignRepository, 'findById').mockResolvedValue({
      id: '1',
      name: 'Test Campaign',
      budget: 1000,
      status: 'Paused',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    });
    vitest.spyOn(adSetRepository, 'findManyByCampaignId').mockResolvedValue([
      {
        id: '1',
        campaignId: '1',
        name: 'Ad Set 1',
        budget: 500,
        status: 'Active',
      },
      {
        id: '2',
        campaignId: '1',
        name: 'Ad Set 2',
        budget: 300,
        status: 'Paused',
      },
      {
        id: '3',
        campaignId: '1',
        name: 'Ad Set 3',
        budget: 1000,
        status: 'Active',
      },
    ]);

    const command = new SwitchCampaignStatusCommand('1', 'Active', 1);

    await expect(handler.execute(command)).rejects.toMatchObject({
      response: { errorCode: 'ADSET_LIMIT_EXCEEDED' },
      name: 'ConflictException',
    });
  });

  it(`GIVEN:
    a campaign with id 1 and status 'Paused' and version 1 and budget 1000 exists in the database
AND:
    AdSets
    id | campaignId | name   | budget   | status 
    ---|------------|--------|----------|--------
    1 | 1          | Ad Set 1 | 500    | Active
    2 | 1          | Ad Set 2 | 300    | Paused
    3 | 1          | Ad Set 2 | 1000   | Active
WHEN:
    I attempt to switch the campaign status to 'Active' with version 1
THEN:
    the campaign status should be updated to 'Active'`, async () => {
    vitest.spyOn(campaignRepository, 'findById').mockResolvedValue({
      id: '1',
      name: 'Test Campaign',
      budget: 1000,
      status: 'Paused',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    });
    vitest.spyOn(adSetRepository, 'findManyByCampaignId').mockResolvedValue([
      {
        id: '1',
        campaignId: '1',
        name: 'Ad Set 1',
        budget: 500,
        status: 'Active',
      },
      {
        id: '2',
        campaignId: '1',
        name: 'Ad Set 2',
        budget: 300,
        status: 'Paused',
      },
      {
        id: '3',
        campaignId: '1',
        name: 'Ad Set 3',
        budget: 1000,
        status: 'Active',
      },
    ]);

    const command = new SwitchCampaignStatusCommand('1', 'Active', 1);

    await expect(handler.execute(command)).rejects.toMatchObject({
      response: { errorCode: 'CAMPAIGN_BUDGET_EXCEEDED' },
      name: 'ConflictException',
    });
  });

  it(`GIVEN:
    a campaign with id 1 and status 'Paused' and version 1 and budget 1000 exists in the database
AND:
    AdSets
    id | campaignId | name   | budget   | status 
    ---|------------|--------|----------|--------
    1 | 1          | Ad Set 1 | 500    | Active
    2 | 1          | Ad Set 2 | 300    | Paused
WHEN:
    I attempt to switch the campaign status to 'Active' with version 1
THEN:
    the campaign status should be updated to 'Active'`, async () => {
    vitest.spyOn(campaignRepository, 'findById').mockResolvedValue({
      id: '1',
      name: 'Test Campaign',
      budget: 1000,
      status: 'Paused',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    });
    vitest.spyOn(adSetRepository, 'findManyByCampaignId').mockResolvedValue([
      {
        id: '1',
        campaignId: '1',
        name: 'Ad Set 1',
        budget: 500,
        status: 'Active',
      },
      {
        id: '2',
        campaignId: '1',
        name: 'Ad Set 2',
        budget: 300,
        status: 'Paused',
      },
    ]);

    const command = new SwitchCampaignStatusCommand('1', 'Active', 1);

    const result = await handler.execute(command);

    expect(result).toMatchObject({
      id: '1',
      status: 'Active',
    });
  });
});
