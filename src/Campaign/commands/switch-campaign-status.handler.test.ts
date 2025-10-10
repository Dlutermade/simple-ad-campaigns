import { Test, TestingModule } from '@nestjs/testing';
import { SwitchCampaignStatusHandler } from './switch-campaign-status.handler';
import { CampaignRepository } from '../repository/campaign.repository';
import { SwitchCampaignStatusCommand } from './switch-campaign-status.command';
import { ConflictException } from '@nestjs/common';
import { campaignsTable } from '@src/db/schema';

describe('SwitchCampaignStatusHandler', () => {
  let handler: SwitchCampaignStatusHandler;
  let repository: CampaignRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SwitchCampaignStatusHandler,
        {
          provide: CampaignRepository,
          useValue: {
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
      ],
    }).compile();

    handler = module.get<SwitchCampaignStatusHandler>(
      SwitchCampaignStatusHandler,
    );
    repository = module.get<CampaignRepository>(CampaignRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it(`
GIVEN:
    No campaign with id 1 exists in the database
WHEN:
    I attempt to switch the campaign status to 'Active'
THEN:
    a NotFoundException should be thrown
  `, async () => {
    vitest.spyOn(repository, 'findById').mockResolvedValue(undefined);

    const command = new SwitchCampaignStatusCommand('1', 'Active', 1);

    await expect(handler.execute(command)).rejects.toThrowError(
      expect.objectContaining({
        constructor: ConflictException,
        response: { errorCode: 'CAMPAIGN_NOT_FOUND' },
      }),
    );
  });

  it(`
GIVEN:
    a campaign with id 1 and status 'Deleted' exists in the database
WHEN:
    I attempt to switch the campaign status to 'Active'
THEN:
    a ConflictException should be thrown
  `, async () => {
    vitest.spyOn(repository, 'findById').mockResolvedValue({
      id: '1',
      name: 'Test Campaign',
      budget: 1000,
      status: 'Deleted',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    });

    const command = new SwitchCampaignStatusCommand('1', 'Active', 1);

    await expect(handler.execute(command)).rejects.toThrowError(
      expect.objectContaining({
        constructor: ConflictException,
        response: { errorCode: 'CAMPAIGN_DELETED' },
      }),
    );
  });

  it(`
GIVEN:
    a campaign with id 1 and status 'Paused' and version 2 exists in the database
WHEN:
    I attempt to switch the campaign status to 'Active' with version 1
THEN:
    a ConflictException should be thrown
  `, async () => {
    vitest.spyOn(repository, 'findById').mockResolvedValue({
      id: '1',
      name: 'Test Campaign',
      budget: 1000,
      status: 'Paused',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 2,
    });

    const command = new SwitchCampaignStatusCommand('1', 'Active', 1);

    await expect(handler.execute(command)).rejects.toThrowError(
      expect.objectContaining({
        constructor: ConflictException,
        response: { errorCode: 'CAMPAIGN_VERSION_MISMATCH' },
      }),
    );
  });

  it(`
GIVEN:
    a campaign with id 1 and status 'Paused' exists in the database
WHEN:
    I attempt to switch the campaign status to 'Paused'
THEN:
    a ConflictException should be thrown
  `, async () => {
    vitest.spyOn(repository, 'findById').mockResolvedValue({
      id: '1',
      name: 'Test Campaign',
      budget: 1000,
      status: 'Paused',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    });

    const command = new SwitchCampaignStatusCommand('1', 'Paused', 1);

    await expect(handler.execute(command)).rejects.toThrowError(
      expect.objectContaining({
        constructor: ConflictException,
        response: { errorCode: 'CAMPAIGN_STATUS_UNCHANGED' },
      }),
    );
  });

  it(`
GIVEN:
    a campaign with id 1 and status 'Paused' and version 1 exists in the database
WHEN:
    I attempt to switch the campaign status to 'Active' with version 1
THEN:
    the campaign status should be updated to 'Active'
  `, async () => {
    vitest.spyOn(repository, 'findById').mockResolvedValue({
      id: '1',
      name: 'Test Campaign',
      budget: 1000,
      status: 'Paused',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    });

    const command = new SwitchCampaignStatusCommand('1', 'Active', 1);

    await handler.execute(command);

    expect(repository.update).toHaveBeenCalledWith('1', {
      status: 'Active',
      version: 1,
    });
  });
});
