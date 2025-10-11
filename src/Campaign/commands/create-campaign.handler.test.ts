import { Test, TestingModule } from '@nestjs/testing';
import { CreateCampaignHandler } from './create-campaign.handler';

import { CampaignRepository } from '../repository/campaign.repository';
import { CreateCampaignCommand } from './create-campaign.command';

describe('CreateCampaignHandler', () => {
  let handler: CreateCampaignHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateCampaignHandler,
        {
          provide: CampaignRepository,
          useValue: {
            create: vitest
              .fn()
              .mockImplementation((data: { name: string; budget: number }) => ({
                id: '1',
                name: data.name,
                budget: data.budget,
                status: 'Paused',
              })),
          },
        },
      ],
    }).compile();

    handler = module.get<CreateCampaignHandler>(CreateCampaignHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should create a campaign', async () => {
    const command = new CreateCampaignCommand('Test Campaign', 1000);

    const expectedCampaign = {
      id: '1',
      name: 'Test Campaign',
      budget: 1000,
      status: 'Paused',
    };

    const result = await handler.execute(command);

    expect(result).toEqual(expectedCampaign);
  });
});
