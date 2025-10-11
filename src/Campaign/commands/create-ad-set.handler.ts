import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateAdSetResult } from './create-ad-set.result';
import { CreateAdSetCommand } from './create-ad-set.command';
import { AdSetRepository } from '../repository/ad-set.repository';
import {
  ConflictException,
  Inject,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CampaignRepository } from '../repository/campaign.repository';
import { DRIZZLE_PROVIDER, PgDatabase } from '@src/libs/drizzle.module';
import { MAX_AD_SETS_PER_CAMPAIGN } from '@src/constants/ad-set.constnts';

@CommandHandler(CreateAdSetCommand)
export class CreateAdSetHandler
  implements ICommandHandler<CreateAdSetCommand, CreateAdSetResult>
{
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: PgDatabase,
    private readonly campaignRepository: CampaignRepository,
    private readonly adSetRepository: AdSetRepository,
  ) {}

  private readonly logger = new Logger(CreateAdSetHandler.name);

  async execute(command: CreateAdSetCommand) {
    this.logger.log('Creating a new ad set...', command);

    const result = await this.db.transaction(async (tx) => {
      const campaign = await this.campaignRepository.findById(
        command.campaignId,
        {
          txClient: tx,
          lock: { strength: 'update' },
        },
      );

      if (!campaign) {
        this.logger.error(`Campaign with ID ${command.campaignId} not found.`);
        throw new NotFoundException({
          errorCode: 'CAMPAIGN_NOT_FOUND',
          campaignId: command.campaignId,
        });
      }

      const existingAdSets = await this.adSetRepository.findManyByCampaignId(
        command.campaignId,
        { txClient: tx },
      );

      if (existingAdSets.length >= MAX_AD_SETS_PER_CAMPAIGN) {
        this.logger.error(
          `Campaign with ID ${command.campaignId} already has maximum number of ad sets.`,
        );
        throw new ConflictException({
          errorCode: 'MAX_AD_SETS_REACHED',
          campaignId: command.campaignId,
          adSetCount: existingAdSets.length,
          maximumAllowed: MAX_AD_SETS_PER_CAMPAIGN,
        });
      }

      const newAdSet = await this.adSetRepository.create(
        {
          campaignId: command.campaignId,
          name: command.name,
          budget: command.budget,
        },
        { txClient: tx },
      );

      return newAdSet;
    });

    this.logger.log('Ad set created successfully.', result);
    return result;
  }
}
