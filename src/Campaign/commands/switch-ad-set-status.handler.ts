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
import { SwitchAdSetStatusCommand } from './switch-ad-set-status.command';
import { SwitchAdSetStatusResult } from './switch-ad-set-status.result';
import { AdRepository } from '../repository/ad.repository';

@CommandHandler(SwitchAdSetStatusCommand)
export class SwitchAdSetStatusHandler
  implements ICommandHandler<SwitchAdSetStatusCommand, SwitchAdSetStatusResult>
{
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: PgDatabase,
    private readonly campaignRepository: CampaignRepository,
    private readonly adSetRepository: AdSetRepository,
    private readonly adRepository: AdRepository,
  ) {}

  private readonly logger = new Logger(SwitchAdSetStatusHandler.name);

  async execute(command: SwitchAdSetStatusCommand) {
    this.logger.log(`Executing SwitchAdSetStatusCommand...`, command);

    const result = await this.db.transaction(async (tx) => {
      const campaign = await this.campaignRepository.findById(
        command.campaignId,
        {
          txClient: tx,
          lock: {
            strength: 'update',
          },
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
        this.logger.error(
          `Cannot switch status of Ad Set because its Campaign with ID ${command.campaignId} is deleted.`,
        );
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
        });
      }

      const adSet = await this.adSetRepository.findById(command.adSetId, {
        txClient: tx,
        lock: {
          strength: 'update',
        },
      });
      if (!adSet) {
        this.logger.error(`Ad Set with ID ${command.adSetId} not found.`);
        throw new NotFoundException({
          errorCode: 'AD_SET_NOT_FOUND',
          adSetId: command.adSetId,
        });
      }

      if (adSet.status === 'Deleted') {
        this.logger.error(
          `Cannot switch status of Ad Set with ID ${command.adSetId} because it is deleted.`,
        );
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

      if (adSet.status === command.status) {
        this.logger.log(
          `Ad Set with ID ${command.adSetId} already has status '${command.status}'. No changes made.`,
        );
        return adSet;
      }

      if (command.status === 'Active') {
        const ads = await this.adRepository.findManyByAdSetId(command.adSetId, {
          txClient: tx,
        });

        const activeAds = ads.filter((ad) => ad.status === 'Active');
        if (activeAds.length === 0) {
          this.logger.error(
            `Cannot activate Ad Set with ID ${command.adSetId} because it has no active ads.`,
          );
          throw new ConflictException({
            errorCode: 'AD_SET_NO_ACTIVE_ADS',
            adSetId: command.adSetId,
          });
        }

        const adSetsForCampaign =
          await this.adSetRepository.findManyByCampaignId(command.campaignId, {
            txClient: tx,
          });

        const activeAdSets = adSetsForCampaign.filter(
          (set) => set.status === 'Active',
        );

        const totalBudgetOfActiveAdSets = activeAdSets.reduce(
          (sum, set) => sum + set.budget,
          0,
        );

        if (totalBudgetOfActiveAdSets + adSet.budget > campaign.budget) {
          this.logger.error(
            `Cannot activate Ad Set with ID ${command.adSetId} because activating it would exceed the Campaign's budget.`,
          );
          throw new ConflictException({
            errorCode: 'AD_SET_ACTIVATION_EXCEEDS_CAMPAIGN_BUDGET',
            adSetId: command.adSetId,
            campaignId: command.campaignId,
            campaignBudget: campaign.budget,
            totalActiveAdSetsBudget: totalBudgetOfActiveAdSets,
            adSetBudget: adSet.budget,
          });
        }
      }

      if (campaign.status === 'Active' && command.status === 'Paused') {
        const adSetsForCampaign =
          await this.adSetRepository.findManyByCampaignId(command.campaignId, {
            txClient: tx,
          });
        const otherActiveAdSets = adSetsForCampaign.filter(
          (set) => set.id !== adSet.id && set.status === 'Active',
        );
        if (otherActiveAdSets.length === 0) {
          this.logger.error(
            `Cannot pause Ad Set with ID ${command.adSetId} because it is the only active Ad Set in its active Campaign with ID ${command.campaignId}.`,
          );
          throw new ConflictException({
            errorCode: 'AD_SET_ONLY_ACTIVE_IN_ACTIVE_CAMPAIGN',
            adSetId: command.adSetId,
            campaignId: command.campaignId,
          });
        }
      }

      return this.adSetRepository.update(
        command.adSetId,
        { status: command.status },
        { txClient: tx },
      );
    });

    this.logger.log('Ad set status switched successfully.', result);
    return result;
  }
}
