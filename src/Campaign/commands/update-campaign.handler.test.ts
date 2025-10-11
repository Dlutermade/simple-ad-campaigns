import { TestingModule, Test } from '@nestjs/testing';
import { campaignsTable } from '@src/db/schema';
import { DRIZZLE_PROVIDER } from '@src/libs/drizzle.module';
import { CampaignRepository } from '../repository/campaign.repository';
import { UpdateCampaignHandler } from './update-campaign.handler';
import { UpdateCampaignCommand } from './update-campaign.command';

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

  it(`GIVEN:
    No campaign with id 1 exists in the database
WHEN:
    I attempt to update the campaign name
THEN:
    a NotFoundException should be thrown`, async () => {
    vitest.spyOn(campaignRepository, 'findById').mockResolvedValue(undefined);

    const command = new UpdateCampaignCommand('1', 'New Campaign Name', 1);

    await expect(handler.execute(command)).rejects.toMatchObject({
      response: { errorCode: 'CAMPAIGN_NOT_FOUND' },
      name: 'NotFoundException',
    });
  });

  it(`GIVEN:
    a campaign with id 1 and status 'Deleted' exists in the database
WHEN:
    I attempt to update the campaign name
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

    const command = new UpdateCampaignCommand('1', 'New Campaign Name', 1);

    await expect(handler.execute(command)).rejects.toMatchObject({
      response: { errorCode: 'CAMPAIGN_DELETED' },
      name: 'ConflictException',
    });
  });

  it(`GIVEN:
    a campaign with id 1 and version 2 exists in the database
WHEN:
    I attempt to update the campaign name with version 1
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

    const command = new UpdateCampaignCommand('1', 'New Campaign Name', 1);

    await expect(handler.execute(command)).rejects.toMatchObject({
      response: { errorCode: 'CAMPAIGN_VERSION_MISMATCH' },
      name: 'ConflictException',
    });
  });

  it(`GIVEN:
    a campaign with id 1 and version 1 and name 'Test Campaign' exists in the database
WHEN:
    I attempt to update the campaign name to 'Test Campaign' with version 1
THEN:
    skip the update and return the existing campaign`, async () => {
    const existingCampaign = {
      id: '1',
      name: 'Test Campaign',
      budget: 1000,
      status: 'Paused',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    } as const;

    vitest
      .spyOn(campaignRepository, 'findById')
      .mockResolvedValue(existingCampaign);

    const command = new UpdateCampaignCommand('1', 'Test Campaign', 1);

    const result = await handler.execute(command);

    expect(result).toMatchObject({
      name: 'Test Campaign',
      version: 1,
    });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(campaignRepository.update).not.toHaveBeenCalled();
  });

  it(`GIVEN:
    a campaign with id 1 and version 1 exists in the database
WHEN:
    I attempt to update the campaign name to 'New Campaign Name' with version 1
THEN:
    the campaign should be updated and the updated campaign returned`, async () => {
    const existingCampaign = {
      id: '1',
      name: 'Test Campaign',
      budget: 1000,
      status: 'Paused',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    } as const;

    vitest
      .spyOn(campaignRepository, 'findById')
      .mockResolvedValue(existingCampaign);

    const command = new UpdateCampaignCommand('1', 'New Campaign Name', 1);

    const result = await handler.execute(command);

    expect(result).toMatchObject({
      name: 'New Campaign Name',
    });
  });
});
