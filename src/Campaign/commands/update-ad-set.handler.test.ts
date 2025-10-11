import { TestingModule, Test } from '@nestjs/testing';
import { DRIZZLE_PROVIDER } from '@src/libs/drizzle.module';
import { AdSetRepository } from '../repository/ad-set.repository';
import { CampaignRepository } from '../repository/campaign.repository';
import { UpdateAdSetCommand } from './update-ad-set.command';
import { UpdateAdSetHandler } from './update-ad-set.handler';

describe('UpdateAdSetHandler', () => {
  let handler: UpdateAdSetHandler;
  let campaignRepository: CampaignRepository;
  let adSetRepository: AdSetRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateAdSetHandler,
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
            update: vitest
              .fn()
              .mockImplementation(
                (adSetId: string, data: { name: string }) => ({
                  id: adSetId,
                  campaignId: '1',
                  name: data.name,
                  budget: 500,
                  status: 'Paused',
                }),
              ),
            findById: vitest.fn().mockResolvedValue({
              id: '1',
              campaignId: '1',
              name: 'Test Ad Set',
              budget: 500,
              status: 'Paused',
            }),
          },
        },
      ],
    }).compile();

    handler = module.get<UpdateAdSetHandler>(UpdateAdSetHandler);
    campaignRepository = module.get<CampaignRepository>(CampaignRepository);
    adSetRepository = module.get<AdSetRepository>(AdSetRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should throw NotFoundException if campaign does not exist', async () => {
    vitest
      .spyOn(campaignRepository, 'findById')
      .mockResolvedValueOnce(undefined);

    const command = new UpdateAdSetCommand('1', '1', 'Updated Ad Set', 1);

    await expect(handler.execute(command)).rejects.toMatchObject({
      response: {
        errorCode: 'CAMPAIGN_NOT_FOUND',
        campaignId: '1',
      },
    });
  });
  it('should throw NotFoundException if ad set does not exist', async () => {
    vitest.spyOn(adSetRepository, 'findById').mockResolvedValueOnce(undefined);

    const command = new UpdateAdSetCommand('1', '999', 'Updated Ad Set', 1);

    await expect(handler.execute(command)).rejects.toMatchObject({
      response: {
        errorCode: 'AD_SET_NOT_FOUND',
        adSetId: '999',
      },
    });
  });

  it('should throw ConflictException if ad set version is outdated', async () => {
    const command = new UpdateAdSetCommand('1', '1', 'Updated Ad Set', 0);

    await expect(handler.execute(command)).rejects.toMatchObject({
      response: {
        errorCode: 'CAMPAIGN_VERSION_MISMATCH',
        campaignId: '1',
      },
    });
  });

  it('should update ad set successfully', async () => {
    const command = new UpdateAdSetCommand('1', '1', 'Updated Ad Set', 1);

    const result = await handler.execute(command);

    expect(result).toEqual({
      id: '1',
      campaignId: '1',
      name: 'Updated Ad Set',
      budget: 500,
      status: 'Paused',
    });
  });
});
