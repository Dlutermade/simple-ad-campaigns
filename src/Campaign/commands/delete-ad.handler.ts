import {
  ConflictException,
  Inject,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DRIZZLE_PROVIDER, PgDatabase } from '@src/libs/drizzle.module';
import { AdSetRepository } from '../repository/ad-set.repository';
import { AdRepository } from '../repository/ad.repository';
import { CampaignRepository } from '../repository/campaign.repository';
import { DeleteAdCommand } from './delete-ad.command';

@CommandHandler(DeleteAdCommand)
export class DeleteAdHandler implements ICommandHandler<DeleteAdCommand, void> {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: PgDatabase,
    private readonly campaignRepository: CampaignRepository,
    private readonly adSetRepository: AdSetRepository,
    private readonly adRepository: AdRepository,
  ) {}

  private readonly logger = new Logger(DeleteAdHandler.name);

  async execute(command: DeleteAdCommand): Promise<void> {
    this.logger.log('Deleting ad...', command);
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
        this.logger.error(`Ad set with ID ${command.adSetId} not found.`);
        throw new NotFoundException({
          errorCode: 'AD_SET_NOT_FOUND',
          adSetId: command.adSetId,
        });
      }

      if (adSet.status === 'Deleted') {
        this.logger.error(`Ad set with ID ${command.adSetId} is deleted.`);
        throw new ConflictException({
          errorCode: 'AD_SET_DELETED',
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

      const ad = await this.adRepository.findById(command.adId, {
        txClient: tx,
        lock: { strength: 'update' },
      });

      if (!ad) {
        this.logger.error(`Ad with ID ${command.adId} not found.`);
        throw new NotFoundException({
          errorCode: 'AD_NOT_FOUND',
          adId: command.adId,
        });
      }

      if (ad.status === 'Deleted') {
        this.logger.error(`Ad with ID ${command.adId} is deleted.`);
        throw new ConflictException({
          errorCode: 'AD_DELETED',
          adId: command.adId,
        });
      }

      if (ad.adSetId !== command.adSetId) {
        this.logger.error(
          `Ad with ID ${command.adId} does not belong to ad set ID ${command.adSetId}.`,
        );
        throw new ConflictException({
          errorCode: 'AD_AD_SET_MISMATCH',
          adId: command.adId,
          adSetId: command.adSetId,
        });
      }

      if (adSet.status === 'Active' && ad.status === 'Active') {
        const adsOfAdSet = await this.adRepository.findManyByAdSetId(
          command.adSetId,
          {
            txClient: tx,
            lock: { strength: 'update' },
          },
        );

        const otherActiveAds = adsOfAdSet.filter(
          (a) => a.id !== command.adId && a.status === 'Active',
        );

        if (otherActiveAds.length === 0) {
          this.logger.error(
            `Cannot delete the only active ad in an active ad set. AdSet ID: ${command.adSetId}, Ad ID: ${command.adId}`,
          );
          throw new ConflictException({
            errorCode: 'CANNOT_DELETE_ONLY_ACTIVE_AD',
            adId: command.adId,
            adSetId: command.adSetId,
          });
        }
      }

      return this.adRepository.update(
        command.adId,
        {
          status: 'Deleted',
        },
        { txClient: tx },
      );
    });

    this.logger.log(`Ad with ID ${command.adId} deleted successfully.`);
  }
}
