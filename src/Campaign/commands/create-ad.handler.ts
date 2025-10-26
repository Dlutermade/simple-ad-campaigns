import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateAdResult } from './create-ad.result';
import { CreateAdCommand } from './create-ad.command';
import { AdSetRepository } from '../repository/ad-set.repository';
import { AdRepository } from '../repository/ad.repository';

import {
  ConflictException,
  Inject,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CampaignRepository } from '../repository/campaign.repository';
import { DRIZZLE_PROVIDER, PgDatabase } from '@src/libs/drizzle.module';
import { MAXIMUM_AD_PER_CAMPAIGN } from '@src/constants/ad.constants';

@CommandHandler(CreateAdCommand)
export class CreateAdHandler
  implements ICommandHandler<CreateAdCommand, CreateAdResult>
{
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: PgDatabase,
    private readonly campaignRepository: CampaignRepository,
    private readonly adSetRepository: AdSetRepository,
    private readonly adRepository: AdRepository,
  ) {}

  private readonly logger = new Logger(CreateAdHandler.name);

  async execute(command: CreateAdCommand) {
    this.logger.log('Creating a new ad...', command);

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

      if (campaign.status === 'Deleted') {
        this.logger.error(`Campaign with ID ${command.campaignId} is deleted.`);
        throw new ConflictException({
          errorCode: 'CAMPAIGN_DELETED',
          campaignId: command.campaignId,
        });
      }

      if (campaign.version !== command.version) {
        this.logger.error(
          `Campaign version mismatch for ID ${command.campaignId}. Expected ${campaign.version}, got ${command.version}.`,
        );
        throw new ConflictException({
          errorCode: 'CAMPAIGN_VERSION_MISMATCH',
          campaignId: command.campaignId,
          expectedVersion: campaign.version,
          actualVersion: command.version,
        });
      }

      const adSet = await this.adSetRepository.findById(command.adSetId, {
        txClient: tx,
        lock: { strength: 'update' },
      });

      if (!adSet) {
        this.logger.error(`Ad Set with ID ${command.adSetId} not found.`);
        throw new NotFoundException({
          errorCode: 'AD_SET_NOT_FOUND',
          adSetId: command.adSetId,
        });
      }

      if (adSet.status === 'Deleted') {
        this.logger.error(`Ad Set with ID ${command.adSetId} is deleted.`);
        throw new ConflictException({
          errorCode: 'AD_SET_DELETED',
          adSetId: command.adSetId,
        });
      }

      if (adSet.campaignId !== command.campaignId) {
        this.logger.error(
          `Ad Set with ID ${command.adSetId} does not belong to Campaign ID ${command.campaignId}.`,
        );
        throw new ConflictException({
          errorCode: 'AD_SET_CAMPAIGN_MISMATCH',
          adSetId: command.adSetId,
          campaignId: command.campaignId,
        });
      }

      const existingAds = await this.adRepository.findManyByAdSetId(
        command.adSetId,
        {
          txClient: tx,
          lock: { strength: 'update' },
        },
      );

      if (existingAds.length >= MAXIMUM_AD_PER_CAMPAIGN) {
        this.logger.error(
          `Ad Set with ID ${command.adSetId} has reached the maximum number of ads (${MAXIMUM_AD_PER_CAMPAIGN}).`,
        );
        throw new ConflictException({
          errorCode: 'MAX_ADS_REACHED',
          adSetId: command.adSetId,
          adCount: existingAds.length,
          maximumAllowed: MAXIMUM_AD_PER_CAMPAIGN,
        });
      }

      const newAdSet = await this.adRepository.create(
        {
          adSetId: command.adSetId,
          name: command.name,
          content: command.content,
          creative: command.creative,
        },
        { txClient: tx },
      );

      return newAdSet;
    });

    this.logger.log('Ad set created successfully.', result);
    return result;
  }
}
