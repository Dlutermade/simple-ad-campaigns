import { TestingModule, Test } from '@nestjs/testing';
import { DRIZZLE_PROVIDER } from '@src/libs/drizzle.module';
import { AdSetRepository } from '../repository/ad-set.repository';
import { AdRepository } from '../repository/ad.repository';
import { CampaignRepository } from '../repository/campaign.repository';
import { SwitchAdStatusCommand } from './switch-ad-status.command';
import { SwitchAdStatusHandler } from './switch-ad-status.handler';
import { adsTable } from '@src/db/schema';

describe('SwitchAdStatusHandler', () => {
  let handler: SwitchAdStatusHandler;
  let campaignRepository: CampaignRepository;
  let adSetRepository: AdSetRepository;
  let adRepository: AdRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SwitchAdStatusHandler,
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
                  { status }: Pick<typeof adsTable.$inferInsert, 'status'>,
                ) => ({
                  id: adId,
                  adSetId: '1',
                  name: 'Test Ad',
                  content: 'Ad Content',
                  creative: 'Ad Creative',
                  status,
                }),
              ),
          },
        },
      ],
    }).compile();

    handler = module.get<SwitchAdStatusHandler>(SwitchAdStatusHandler);
    campaignRepository = module.get<CampaignRepository>(CampaignRepository);
    adSetRepository = module.get<AdSetRepository>(AdSetRepository);
    adRepository = module.get<AdRepository>(AdRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should switch ad status to Paused successfully', async () => {
    vitest.spyOn(adRepository, 'findManyByAdSetId').mockResolvedValue([
      {
        id: '2',
        adSetId: '1',
        name: 'Another Test Ad',
        content: 'Another Ad Content',
        creative: 'Another Ad Creative',
        status: 'Active',
      },
    ]);
    const command = new SwitchAdStatusCommand('1', '1', '1', 'Paused', 1);

    const result = await handler.execute(command);

    expect(result).toMatchObject({
      id: '1',
      adSetId: '1',
      name: 'Test Ad',
      content: 'Ad Content',
      creative: 'Ad Creative',
      status: 'Paused',
    });
  });

  it('should switch ad status to Active successfully', async () => {
    vitest.spyOn(adRepository, 'findById').mockResolvedValueOnce({
      id: '1',
      adSetId: '1',
      name: 'Test Ad',
      content: 'Ad Content',
      creative: 'Ad Creative',
      status: 'Paused',
    });
    const command = new SwitchAdStatusCommand('1', '1', '1', 'Active', 1);

    const result = await handler.execute(command);

    expect(result).toMatchObject({
      id: '1',
      adSetId: '1',
      name: 'Test Ad',
      content: 'Ad Content',
      creative: 'Ad Creative',
      status: 'Active',
    });
  });

  it('should throw NotFoundException if campaign does not exist', async () => {
    vitest
      .spyOn(campaignRepository, 'findById')
      .mockResolvedValueOnce(undefined);

    const command = new SwitchAdStatusCommand('1', '1', '1', 'Paused', 1);

    await expect(handler.execute(command)).rejects.toMatchObject({
      response: {
        errorCode: 'CAMPAIGN_NOT_FOUND',
        campaignId: '1',
      },
    });
  });

  it('should throw NotFoundException if ad set does not exist', async () => {
    vitest.spyOn(adSetRepository, 'findById').mockResolvedValueOnce(undefined);

    const command = new SwitchAdStatusCommand('1', '999', '1', 'Paused', 1);

    await expect(handler.execute(command)).rejects.toMatchObject({
      response: {
        errorCode: 'AD_SET_NOT_FOUND',
        adSetId: '999',
      },
    });
  });

  it('should throw NotFoundException if ad does not exist', async () => {
    vitest.spyOn(adRepository, 'findById').mockResolvedValueOnce(undefined);

    const command = new SwitchAdStatusCommand('1', '1', '999', 'Paused', 1);

    await expect(handler.execute(command)).rejects.toMatchObject({
      response: {
        errorCode: 'AD_NOT_FOUND',
        adId: '999',
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

    const command = new SwitchAdStatusCommand('1', '1', '1', 'Paused', 1);

    await expect(handler.execute(command)).rejects.toMatchObject({
      response: {
        errorCode: 'AD_SET_CAMPAIGN_MISMATCH',
        adSetId: '1',
        campaignId: '1',
      },
    });
  });

  it('should throw ConflictException if ad set is deleted', async () => {
    vitest.spyOn(adSetRepository, 'findById').mockResolvedValueOnce({
      id: '1',
      campaignId: '1',
      name: 'Test Ad Set',
      budget: 500,
      status: 'Deleted',
    });

    const command = new SwitchAdStatusCommand('1', '1', '1', 'Paused', 1);

    await expect(handler.execute(command)).rejects.toMatchObject({
      response: {
        errorCode: 'AD_SET_DELETED',
        adSetId: '1',
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

    const command = new SwitchAdStatusCommand('1', '1', '1', 'Paused', 1);

    await expect(handler.execute(command)).rejects.toMatchObject({
      response: {
        errorCode: 'AD_AD_SET_MISMATCH',
        adId: '1',
        adSetId: '1',
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

    const command = new SwitchAdStatusCommand('1', '1', '1', 'Paused', 1);

    await expect(handler.execute(command)).rejects.toMatchObject({
      response: {
        errorCode: 'AD_DELETED',
        adId: '1',
      },
    });
  });

  it('should throw ConflictException if trying to pause the only active ad in an active ad set', async () => {
    vitest.spyOn(adRepository, 'findManyByAdSetId').mockResolvedValue([]);
    const command = new SwitchAdStatusCommand('1', '1', '1', 'Paused', 1);

    await expect(handler.execute(command)).rejects.toMatchObject({
      response: {
        errorCode: 'CANNOT_PAUSE_ONLY_ACTIVE_AD',
        adId: '1',
        adSetId: '1',
      },
    });

    await expect(handler.execute(command)).rejects.toMatchObject({
      response: {
        errorCode: 'CANNOT_PAUSE_ONLY_ACTIVE_AD',
        adId: '1',
        adSetId: '1',
      },
    });
  });
});
