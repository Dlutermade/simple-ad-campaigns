import {
  ConflictException,
  Inject,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DRIZZLE_PROVIDER, PgDatabase } from '@src/libs/drizzle.module';
import { AdSetRepository } from '../repository/ad-set.repository';
import { CampaignRepository } from '../repository/campaign.repository';
import { UpdateAdSetResult } from './update-ad-set.result';
import { UpdateAdSetCommand } from './update-ad-set.command';

@CommandHandler(UpdateAdSetCommand)
export class UpdateAdSetHandler
  implements ICommandHandler<UpdateAdSetCommand, UpdateAdSetResult>
{
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: PgDatabase,
    private readonly campaignRepository: CampaignRepository,
    private readonly adSetRepository: AdSetRepository,
  ) {}

  private readonly logger = new Logger(UpdateAdSetHandler.name);

  async execute(command: UpdateAdSetCommand) {
    this.logger.log('Updating ad set...', command);

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

      if (campaign.version !== command.version) {
        this.logger.error(
          `Campaign with ID ${command.campaignId} has a version conflict.`,
        );
        throw new ConflictException({
          errorCode: 'CAMPAIGN_VERSION_MISMATCH',
          campaignId: command.campaignId,
          currentVersion: campaign.version,
        });
      }

      const adSet = await this.adSetRepository.findById(command.adSetId, {
        txClient: tx,
      });

      if (!adSet) {
        this.logger.error(`Ad Set with ID ${command.adSetId} not found.`);
        throw new NotFoundException({
          errorCode: 'AD_SET_NOT_FOUND',
          adSetId: command.adSetId,
        });
      }

      if (adSet.campaignId !== command.campaignId) {
        this.logger.error(
          `Ad Set with ID ${command.adSetId} does not belong to Campaign with ID ${command.campaignId}.`,
        );
        throw new ConflictException({
          errorCode: 'AD_SET_CAMPAIGN_MISMATCH',
          adSetId: command.adSetId,
          campaignId: command.campaignId,
        });
      }

      if (adSet.name === command.name) {
        this.logger.log(
          `Ad Set with ID ${command.adSetId} has no changes to update.`,
        );
        return adSet;
      }

      return this.adSetRepository.update(
        command.adSetId,
        { name: command.name },
        { txClient: tx },
      );
    });

    this.logger.log('Ad set updated successfully.', result);
    return result;
  }
}
