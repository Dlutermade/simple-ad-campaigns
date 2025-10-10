import { Test, TestingModule } from '@nestjs/testing';
import { SwitchCampaignStatusHandler } from './switch-campaign-status.handler';
import { CampaignRepository } from '../repository/campaign.repository';
import { SwitchCampaignStatusCommand } from './switch-campaign-status.command';
import { ConflictException } from '@nestjs/common';

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
            save: vitest.fn(),
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
        response: { errorCode: 'ALREADY_IN_DESIRED_STATE' },
      }),
    );
  });
});
