/* eslint-disable @typescript-eslint/unbound-method */
import { TestingModule, Test } from '@nestjs/testing';
import { DRIZZLE_PROVIDER } from '@src/libs/drizzle.module';
import { AdSetRepository } from '../repository/ad-set.repository';
import { AdRepository } from '../repository/ad.repository';
import { CampaignRepository } from '../repository/campaign.repository';
import { UpdateAdHandler } from './update-ad.handler';
import { UpdateAdCommand } from './update-ad.command';

describe('UpdateAdHandler', () => {
  let handler: UpdateAdHandler;
  let campaignRepository: CampaignRepository;
  let adSetRepository: AdSetRepository;
  let adRepository: AdRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateAdHandler,
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
            findById: vitest.fn().mockResolvedValue({
              id: '1',
              campaignId: '1',
              name: 'Test Ad Set',
              budget: 500,
              status: 'Active',
              version: 1,
            }),
          },
        },
        {
          provide: AdRepository,
          useValue: {
            findById: vitest.fn().mockResolvedValue({
              id: '1',
              adSetId: '1',
              name: 'Test Ad',
              content: 'Ad Content',
              creative: 'Ad Creative',
              status: 'Active',
            }),
            findManyByAdSetId: vitest.fn().mockResolvedValue([]),
            update: vitest
              .fn()
              .mockImplementation(
                (
                  adId: string,
                  data: { name?: string; content?: string; creative?: string },
                ) => ({
                  id: adId,
                  adSetId: '1',
                  name: data.name || 'Test Ad',
                  content: data.content || 'Ad Content',
                  creative: data.creative || 'Ad Creative',
                  status: 'Active',
                }),
              ),
          },
        },
      ],
    }).compile();

    handler = module.get<UpdateAdHandler>(UpdateAdHandler);
    campaignRepository = module.get<CampaignRepository>(CampaignRepository);
    adSetRepository = module.get<AdSetRepository>(AdSetRepository);
    adRepository = module.get<AdRepository>(AdRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should update an ad', async () => {
    const command = new UpdateAdCommand(
      '1',
      '1',
      '1',
      'Updated Ad Name',
      'Updated Ad Content',
      'Updated Ad Creative',
      1,
    );
    const result = await handler.execute(command);

    expect(result).toEqual({
      id: '1',
      adSetId: '1',
      name: 'Updated Ad Name',
      content: 'Updated Ad Content',
      creative: 'Updated Ad Creative',
      status: 'Active',
    });
  });

  it('should throw NotFoundException if campaign not found', async () => {
    vitest
      .spyOn(campaignRepository, 'findById')
      .mockResolvedValueOnce(undefined);

    const command = new UpdateAdCommand(
      '999',
      '1',
      '1',
      'Updated Ad Name',
      'Updated Ad Content',
      'Updated Ad Creative',
      1,
    );

    await expect(handler.execute(command)).rejects.toMatchObject({
      status: 404,
      response: {
        errorCode: 'CAMPAIGN_NOT_FOUND',
        campaignId: '999',
      },
    });
  });

  it('should throw NotFoundException if ad set not found', async () => {
    vitest.spyOn(adSetRepository, 'findById').mockResolvedValueOnce(undefined);

    const command = new UpdateAdCommand(
      '1',
      '999',
      '1',
      'Updated Ad Name',
      'Updated Ad Content',
      'Updated Ad Creative',
      1,
    );

    await expect(handler.execute(command)).rejects.toMatchObject({
      status: 404,
      response: {
        errorCode: 'AD_SET_NOT_FOUND',
        adSetId: '999',
      },
    });
  });

  it('should throw ConflictException if campaign is deleted', async () => {
    vitest.spyOn(campaignRepository, 'findById').mockResolvedValueOnce({
      id: '1',
      name: 'Test Campaign',
      budget: 1000,
      status: 'Deleted',
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const command = new UpdateAdCommand(
      '1',
      '1',
      '1',
      'Updated Ad Name',
      'Updated Ad Content',
      'Updated Ad Creative',
      1,
    );

    await expect(handler.execute(command)).rejects.toMatchObject({
      status: 409,
      response: {
        errorCode: 'CAMPAIGN_DELETED',
        campaignId: '1',
      },
    });
  });

  it('should throw ConflictException if ad set does not belong to campaign', async () => {
    vitest.spyOn(adSetRepository, 'findById').mockResolvedValueOnce({
      id: '1',
      campaignId: '2',
      name: 'Test Ad Set',
      budget: 500,
      status: 'Active',
    });

    const command = new UpdateAdCommand(
      '1',
      '1',
      '1',
      'Updated Ad Name',
      'Updated Ad Content',
      'Updated Ad Creative',
      1,
    );

    await expect(handler.execute(command)).rejects.toMatchObject({
      status: 409,
      response: {
        errorCode: 'AD_SET_CAMPAIGN_MISMATCH',
        adSetId: '1',
        campaignId: '1',
      },
    });
  });

  it('should throw ConflictException if ad does not belong to ad set', async () => {
    vitest.spyOn(adRepository, 'findById').mockResolvedValueOnce({
      id: '1',
      adSetId: '2',
      name: 'Test Ad',
      content: 'Ad Content',
      creative: 'Ad Creative',
      status: 'Active',
    });

    const command = new UpdateAdCommand(
      '1',
      '1',
      '1',
      'Updated Ad Name',
      'Updated Ad Content',
      'Updated Ad Creative',
      1,
    );

    await expect(handler.execute(command)).rejects.toMatchObject({
      status: 409,
      response: {
        errorCode: 'AD_AD_SET_MISMATCH',
        adId: '1',
        adSetId: '1',
      },
    });
  });

  it('should throw NotFoundException if ad not found', async () => {
    vitest.spyOn(adRepository, 'findById').mockResolvedValueOnce(undefined);

    const command = new UpdateAdCommand(
      '1',
      '1',
      '999',
      'Updated Ad Name',
      'Updated Ad Content',
      'Updated Ad Creative',
      1,
    );

    await expect(handler.execute(command)).rejects.toMatchObject({
      status: 404,
      response: {
        errorCode: 'AD_NOT_FOUND',
        adId: '999',
      },
    });
  });

  it('should throw ConflictException if ad is deleted', async () => {
    vitest.spyOn(adRepository, 'findById').mockResolvedValueOnce({
      id: '1',
      adSetId: '1',
      name: 'Test Ad',
      content: 'Ad Content',
      creative: 'Ad Creative',
      status: 'Deleted',
    });

    const command = new UpdateAdCommand(
      '1',
      '1',
      '1',
      'Updated Ad Name',
      'Updated Ad Content',
      'Updated Ad Creative',
      1,
    );

    await expect(handler.execute(command)).rejects.toMatchObject({
      status: 409,
      response: {
        errorCode: 'AD_DELETED',
        adId: '1',
      },
    });
  });

  it('should do nothing if no fields are changed', async () => {
    const command = new UpdateAdCommand(
      '1',
      '1',
      '1',
      'Test Ad',
      'Ad Content',
      'Ad Creative',
      1,
    );
    const result = await handler.execute(command);

    expect(result).toEqual({
      id: '1',
      adSetId: '1',
      name: 'Test Ad',
      content: 'Ad Content',
      creative: 'Ad Creative',
      status: 'Active',
    });

    expect(adRepository.update).not.toHaveBeenCalled();
  });
});
