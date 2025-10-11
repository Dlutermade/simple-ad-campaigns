import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AdjustCampaignBudgetCommand } from './adjust-campaign-budget.command';
import { AdjustCampaignBudgetResult } from './adjust-campaign-budget.result';
import {
  ConflictException,
  Inject,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DRIZZLE_PROVIDER, PgDatabase } from '@src/libs/drizzle.module';
import { AdSetRepository } from '../repository/ad-set.repository';
import { CampaignRepository } from '../repository/campaign.repository';

@CommandHandler(AdjustCampaignBudgetCommand)
export class AdjustCampaignBudgetHandler
  implements
    ICommandHandler<AdjustCampaignBudgetCommand, AdjustCampaignBudgetResult>
{
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: PgDatabase,
    private readonly campaignRepository: CampaignRepository,
    private readonly adSetRepository: AdSetRepository,
  ) {}

  private readonly logger = new Logger(AdjustCampaignBudgetHandler.name);

  async execute(
    command: AdjustCampaignBudgetCommand,
  ): Promise<AdjustCampaignBudgetResult> {
    this.logger.log('Adjusting campaign budget...', command);

    const result = await this.db.transaction(async (tx) => {
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
          `Campaign version mismatch: expected ${command.version}, found ${campaign.version}.`,
        );
        throw new ConflictException({
          errorCode: 'CAMPAIGN_VERSION_MISMATCH',
          id: command.id,
          expectedVersion: command.version,
          actualVersion: campaign.version,
        });
      }

      const adjustedBudget = campaign.budget + command.adjustAmount;

      if (campaign.status === 'Active') {
        const adSets = await this.adSetRepository.findManyByCampaignId(
          command.id,
          {
            txClient: tx,
          },
        );

        const totalBudgetForActiveAdSets = adSets
          .filter((adSet) => adSet.status === 'Active')
          .reduce((sum, adSet) => sum + adSet.budget, 0);

        if (adjustedBudget < totalBudgetForActiveAdSets) {
          this.logger.error(
            `Adjusted budget ${adjustedBudget} is less than total budget for active ad sets ${totalBudgetForActiveAdSets}.`,
          );
          throw new ConflictException({
            errorCode: 'CAMPAIGN_BUDGET_LESS_THAN_ACTIVE_ADSETS_TOTAL_BUDGET',
            id: command.id,
            adjustedBudget,
            totalBudgetForActiveAdSets,
          });
        }
      }

      const updatedCampaign = await this.campaignRepository.update(
        command.id,
        {
          budget: adjustedBudget,
          version: campaign.version,
        },
        {
          txClient: tx,
        },
      );

      this.logger.log(
        'Campaign status switched successfully.',
        updatedCampaign,
      );

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
    });

    return result;
  }
}
