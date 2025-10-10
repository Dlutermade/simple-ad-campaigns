import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SwitchCampaignStatusCommand } from './switch-campaign-status.command';
import { SwitchCampaignStatusResult } from './switch-campaign-status.result';
import {
  ConflictException,
  Inject,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CampaignRepository } from '../repository/campaign.repository';
import { DRIZZLE_PROVIDER, PgDatabase } from '@src/libs/drizzle.module';
import { AdSetRepository } from '../repository/ad-set.repository';

@CommandHandler(SwitchCampaignStatusCommand)
export class SwitchCampaignStatusHandler
  implements
    ICommandHandler<SwitchCampaignStatusCommand, SwitchCampaignStatusResult>
{
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: PgDatabase,
    private readonly campaignRepository: CampaignRepository,
    private readonly adSetRepository: AdSetRepository,
  ) {}

  private readonly logger = new Logger(SwitchCampaignStatusHandler.name);

  async execute(
    command: SwitchCampaignStatusCommand,
  ): Promise<SwitchCampaignStatusResult> {
    this.logger.log('Switching campaign status...', command);

    const updatedCampaign = await this.db.transaction(async (tx) => {
      this.logger.log('Transaction started for switching campaign status.');

      const campaign = await this.campaignRepository
        .findById(command.id, {
          txClient: tx,
          lock: {
            strength: 'update',
            lockConfig: {
              noWait: true,
            },
          },
        })
        .catch((error) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if (error?.code === '55P03') {
            this.logger.error(
              'Could not acquire lock on the campaign. It might be being modified by another transaction.',
              error,
            );
            throw new ConflictException(
              {
                errorCode: 'CAMPAIGN_LOCKED',
                id: command.id,
              },
              'Campaign is currently being modified. Please try again later.',
            );
          }
          throw error;
        });

      if (!campaign) {
        this.logger.error(`Campaign with id ${command.id} not found.`);
        throw new NotFoundException({
          errorCode: 'CAMPAIGN_NOT_FOUND',
          id: command.id,
        });
      }

      if (campaign.status === 'Deleted') {
        this.logger.error(
          `Campaign with id ${command.id} is deleted and cannot be modified.`,
        );
        throw new ConflictException({
          errorCode: 'CAMPAIGN_DELETED',
          id: command.id,
        });
      }

      if (campaign.version !== command.version) {
        this.logger.error(
          `Campaign with id ${command.id} has version ${campaign.version}, but command has version ${command.version}.`,
        );
        throw new ConflictException({
          errorCode: 'CAMPAIGN_VERSION_MISMATCH',
          id: command.id,
          currentVersion: campaign.version,
          providedVersion: command.version,
        });
      }

      if (campaign.status === command.status) {
        this.logger.error(
          `Campaign with id ${command.id} is already in status ${command.status}.`,
        );
        throw new ConflictException({
          errorCode: 'CAMPAIGN_STATUS_UNCHANGED',
          id: command.id,
          status: command.status,
        });
      }

      if (command.status === 'Active') {
        const adSets = await this.adSetRepository.findManyByCampaignId(
          command.id,
          {
            txClient: tx,
          },
        );

        if (adSets.length > 3) {
          this.logger.error(
            `Cannot activate campaign with id ${command.id} because it has more than 3 ad sets.`,
          );
          throw new ConflictException({
            errorCode: 'ADSET_LIMIT_EXCEEDED',
            id: command.id,
            adSetCount: adSets.length,
          });
        }

        const activeAdSets = adSets.filter(
          (adSet) => adSet.status === 'Active',
        );

        if (activeAdSets.length === 0) {
          this.logger.error(
            `Cannot activate campaign with id ${command.id} because it has no active ad sets.`,
          );
          throw new ConflictException({
            errorCode: 'NO_ACTIVE_ADSETS',
            id: command.id,
          });
        }

        const totalBudgetForActiveAdSets = activeAdSets.reduce(
          (sum, adSet) => sum + adSet.budget,
          0,
        );

        if (totalBudgetForActiveAdSets > campaign.budget) {
          this.logger.error(
            `Cannot activate campaign with id ${command.id} because total budget of active ad sets (${totalBudgetForActiveAdSets}) exceeds campaign budget (${campaign.budget}).`,
          );
          throw new ConflictException({
            errorCode: 'CAMPAIGN_BUDGET_EXCEEDED',
            id: command.id,
            campaignBudget: campaign.budget,
            totalAdSetsBudget: totalBudgetForActiveAdSets,
          });
        }
      }

      return this.campaignRepository.update(
        command.id,
        {
          status: command.status,
          version: campaign.version,
        },
        {
          txClient: tx,
        },
      );
    });

    this.logger.log('Campaign status switched successfully.', updatedCampaign);

    if (!updatedCampaign) {
      this.logger.error(
        `campaign version mismatch: Campaign with id ${command.id} was not found after successful transaction.`,
      );
      throw new ConflictException({
        errorCode: 'CAMPAIGN_VERSION_MISMATCH_AFTER_UPDATE',
        id: command.id,
      });
    }

    return updatedCampaign;
  }
}
