import { TestingModule, Test } from '@nestjs/testing';
import { DRIZZLE_PROVIDER } from '@src/libs/drizzle.module';
import { AdSetRepository } from '../repository/ad-set.repository';
import { CampaignRepository } from '../repository/campaign.repository';
import { SwitchAdSetStatusHandler } from './switch-ad-set-status.handler';
import { AdRepository } from '../repository/ad.repository';
import { SwitchAdSetStatusCommand } from './switch-ad-set-status.command';

describe('SwitchAdSetStatusHandler', () => {
  let handler: SwitchAdSetStatusHandler;
  let campaignRepository: CampaignRepository;
  let adSetRepository: AdSetRepository;
  let adRepository: AdRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SwitchAdSetStatusHandler,
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
            findManyByCampaignId: vitest.fn().mockResolvedValue([]),
            update: vitest
              .fn()
              .mockImplementation(
                (
                  adSetId: string,
                  { status }: { status: 'Active' | 'Paused' },
                ) => ({
                  id: adSetId,
                  campaignId: '1',
                  name: 'Test Ad Set',
                  budget: 500,
                  status,
                }),
              ),
            findById: vitest.fn().mockResolvedValue({
              id: '1',
              campaignId: '1',
              name: 'Test Ad Set',
              budget: 500,
              status: 'Paused',
              version: 1,
            }),
          },
        },
        {
          provide: AdRepository,
          useValue: {
            findManyByAdSetId: vitest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    handler = module.get<SwitchAdSetStatusHandler>(SwitchAdSetStatusHandler);
    campaignRepository = module.get<CampaignRepository>(CampaignRepository);
    adSetRepository = module.get<AdSetRepository>(AdSetRepository);
    adRepository = module.get<AdRepository>(AdRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it(`GIVEN:
    No ad set with id 1 exists in the database
WHEN:
    I attempt to switch the ad set status
THEN:
    a NotFoundException should be thrown`, async () => {
    vitest.spyOn(adSetRepository, 'findById').mockResolvedValue(undefined);

    const command = new SwitchAdSetStatusCommand('1', '1', 'Active', 1);
    await expect(handler.execute(command)).rejects.toMatchObject({
      response: { errorCode: 'AD_SET_NOT_FOUND' },
      name: 'NotFoundException',
    });
  });

  it(`GIVEN:
    a ad set with id 1 and status 'Deleted' exists in the database
WHEN:
    I attempt to switch the ad set status
THEN:
    a NotFoundException should be thrown`, async () => {
    vitest.spyOn(adSetRepository, 'findById').mockResolvedValue({
      id: '1',
      campaignId: '1',
      name: 'Test Ad Set',
      budget: 500,
      status: 'Deleted',
    });

    const command = new SwitchAdSetStatusCommand('1', '1', 'Active', 1);
    await expect(handler.execute(command)).rejects.toMatchObject({
      response: { errorCode: 'AD_SET_DELETED' },
      name: 'ConflictException',
    });
  });

  it('should switch ad set status to Active when there are active ads', async () => {
    vitest.spyOn(adRepository, 'findManyByAdSetId').mockResolvedValue([
      {
        id: 'ad1',
        adSetId: '1',
        name: 'Ad 1',
        content: 'Ad Content 1',
        creative: 'http://example.com/ad1',
        status: 'Active',
      },
    ]);

    const command = new SwitchAdSetStatusCommand('1', '1', 'Active', 1);
    const result = await handler.execute(command);

    expect(result).toEqual({
      id: '1',
      campaignId: '1',
      name: 'Test Ad Set',
      budget: 500,
      status: 'Active',
    });
  });

  it('should throw ConflictException when switching ad set status to Active with no active ads', async () => {
    vitest.spyOn(adRepository, 'findManyByAdSetId').mockResolvedValue([]);

    const command = new SwitchAdSetStatusCommand('1', '1', 'Active', 1);
    await expect(handler.execute(command)).rejects.toMatchObject({
      response: { errorCode: 'AD_SET_NO_ACTIVE_ADS' },
      name: 'ConflictException',
    });
  });

  it('should throw ConflictException when switching ad set status to Paused in an Active campaign with only one active ad set', async () => {
    vitest.spyOn(adSetRepository, 'findById').mockResolvedValue({
      id: '1',
      campaignId: '1',
      name: 'Test Ad Set',
      budget: 500,
      status: 'Active',
    });

    vitest.spyOn(adSetRepository, 'findManyByCampaignId').mockResolvedValue([]);

    const command = new SwitchAdSetStatusCommand('1', '1', 'Paused', 1);
    await expect(handler.execute(command)).rejects.toMatchObject({
      response: { errorCode: 'AD_SET_ONLY_ACTIVE_IN_ACTIVE_CAMPAIGN' },
      name: 'ConflictException',
    });
  });

  it('should switch ad set status to Paused', async () => {
    const command = new SwitchAdSetStatusCommand('1', '1', 'Paused', 1);

    const result = await handler.execute(command);

    expect(result).toMatchObject({
      id: '1',
      campaignId: '1',
      name: 'Test Ad Set',
      budget: 500,
      status: 'Paused',
    });
  });

  it('should do nothing if ad set already has the desired status', async () => {
    vitest.spyOn(adSetRepository, 'findById').mockResolvedValue({
      id: '1',
      campaignId: '1',
      name: 'Test Ad Set',
      budget: 500,
      status: 'Active',
    });

    const command = new SwitchAdSetStatusCommand('1', '1', 'Active', 1);
    const result = await handler.execute(command);

    expect(result).toMatchObject({
      id: '1',
      campaignId: '1',
      name: 'Test Ad Set',
      budget: 500,
      status: 'Active',
    });
  });

  it('should throw NotFoundException if campaign does not exist', async () => {
    vitest.spyOn(campaignRepository, 'findById').mockResolvedValue(undefined);
    const command = new SwitchAdSetStatusCommand('1', '999', 'Active', 1);

    await expect(handler.execute(command)).rejects.toMatchObject({
      response: { errorCode: 'CAMPAIGN_NOT_FOUND' },
      name: 'NotFoundException',
    });
  });

  it('should throw ConflictException if campaign is Deleted', async () => {
    vitest.spyOn(campaignRepository, 'findById').mockResolvedValue({
      id: '1',
      name: 'Test Campaign',
      budget: 1000,
      status: 'Deleted',
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const command = new SwitchAdSetStatusCommand('1', '1', 'Active', 1);

    await expect(handler.execute(command)).rejects.toMatchObject({
      response: { errorCode: 'CAMPAIGN_NOT_FOUND' },
      name: 'NotFoundException',
    });
  });

  it('should throw ConflictException when switching ad set status to Active there are no active ads', async () => {
    vitest.spyOn(adSetRepository, 'findById').mockResolvedValue({
      id: '1',
      campaignId: '1',
      name: 'Test Ad Set',
      budget: 500,
      status: 'Paused',
    });
    vitest.spyOn(adRepository, 'findManyByAdSetId').mockResolvedValue([]);

    const command = new SwitchAdSetStatusCommand('1', '1', 'Active', 1);
    await expect(handler.execute(command)).rejects.toMatchObject({
      response: { errorCode: 'AD_SET_NO_ACTIVE_ADS' },
      name: 'ConflictException',
    });
  });

  it('should throw ConflictException when switching ad set status to Active in an Active campaign Budget exceeded', async () => {
    vitest.spyOn(adSetRepository, 'findById').mockResolvedValue({
      id: '1',
      campaignId: '1',
      name: 'Test Ad Set',
      budget: 500,
      status: 'Paused',
    });
    vitest.spyOn(campaignRepository, 'findById').mockResolvedValue({
      id: '1',
      name: 'Test Campaign',
      budget: 600,
      status: 'Active',
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vitest.spyOn(adSetRepository, 'findManyByCampaignId').mockResolvedValue([
      {
        id: '2',
        campaignId: '1',
        name: 'Another Ad Set',
        budget: 200,
        status: 'Active',
      },
    ]);
    vitest.spyOn(adRepository, 'findManyByAdSetId').mockResolvedValue([
      {
        id: 'ad1',
        adSetId: '1',
        name: 'Ad 1',
        content: 'Ad Content 1',
        creative: 'http://example.com/ad1',
        status: 'Active',
      },
    ]);

    const command = new SwitchAdSetStatusCommand('1', '1', 'Active', 1);
    await expect(handler.execute(command)).rejects.toMatchObject({
      response: { errorCode: 'AD_SET_ACTIVATION_EXCEEDS_CAMPAIGN_BUDGET' },
      name: 'ConflictException',
    });
  });
});
