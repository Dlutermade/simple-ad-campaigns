import { Test, TestingModule } from '@nestjs/testing';
import { CreateCampaignHandler } from './create-campaign.handler';

import { CampaignRepository } from '../repository/campaign.repository';
import { CreateCampaignCommand } from './create-campaign.command';

describe('CreateCampaignHandler', () => {
  let handler: CreateCampaignHandler;
  let repository: CampaignRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateCampaignHandler,
        {
          provide: CampaignRepository,
          useValue: {
            createCampaign: vitest
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
    repository = module.get<CampaignRepository>(CampaignRepository);
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

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(repository.createCampaign).toBeCalledWith(command);

    expect(result).toEqual(expectedCampaign);
  });
});
