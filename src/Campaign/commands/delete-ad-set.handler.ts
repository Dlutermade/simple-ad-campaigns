import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteAdSetCommand } from './delete-ad-set.command';
import { DRIZZLE_PROVIDER, PgDatabase } from '@src/libs/drizzle.module';
import {
  ConflictException,
  Inject,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AdSetRepository } from '../repository/ad-set.repository';
import { CampaignRepository } from '../repository/campaign.repository';

@CommandHandler(DeleteAdSetCommand)
export class DeleteAdSetHandler
  implements ICommandHandler<DeleteAdSetCommand, void>
{
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: PgDatabase,
    private readonly campaignRepository: CampaignRepository,
    private readonly adSetRepository: AdSetRepository,
  ) {}

  private readonly logger = new Logger(DeleteAdSetHandler.name);

  async execute(command: DeleteAdSetCommand): Promise<void> {
    this.logger.log('Deleting ad set...', command);

    await this.db.transaction(async (tx) => {
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
        this.logger.error(`Ad set with ID ${command.adSetId} not found.`);
        throw new NotFoundException({
          errorCode: 'AD_SET_NOT_FOUND',
          adSetId: command.adSetId,
        });
      }

      if (adSet.campaignId !== command.campaignId) {
        this.logger.error(
          `Ad set with ID ${command.adSetId} does not belong to campaign ID ${command.campaignId}.`,
        );
        throw new ConflictException({
          errorCode: 'AD_SET_CAMPAIGN_MISMATCH',
          adSetId: command.adSetId,
          campaignId: command.campaignId,
        });
      }

      if (adSet.status === 'Deleted') {
        this.logger.error(
          `Ad set with ID ${command.adSetId} is already deleted.`,
        );
        throw new ConflictException({
          errorCode: 'AD_SET_ALREADY_DELETED',
          adSetId: command.adSetId,
        });
      }

      if (campaign.status === 'Active' && adSet.status === 'Active') {
        const otherActiveAdSets =
          await this.adSetRepository.findManyByCampaignId(command.campaignId, {
            txClient: tx,
          });

        const activeAdSetsExcludingCurrent = otherActiveAdSets.filter(
          (set) => set.id !== command.adSetId && set.status === 'Active',
        );

        if (activeAdSetsExcludingCurrent.length === 0) {
          this.logger.error(
            `Cannot delete the only active ad set in an active campaign (Campaign ID: ${command.campaignId}).`,
          );
          throw new ConflictException({
            errorCode: 'CANNOT_DELETE_ONLY_ACTIVE_AD_SET',
            campaignId: command.campaignId,
            adSetId: command.adSetId,
          });
        }
      }

      await this.adSetRepository.update(
        command.adSetId,
        { status: 'Deleted' },
        { txClient: tx },
      );
    });
  }
}
