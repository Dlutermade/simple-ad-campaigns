import {
  ConflictException,
  Inject,
  Logger,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DRIZZLE_PROVIDER, PgDatabase } from '@src/libs/drizzle.module';
import { CampaignRepository } from '../repository/campaign.repository';
import { UpdateCampaignCommand } from './update-campaign.command';
import { UpdateCampaignResult } from './update-campaign.result';

@CommandHandler(UpdateCampaignCommand)
export class UpdateCampaignHandler
  implements ICommandHandler<UpdateCampaignCommand, UpdateCampaignResult>
{
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: PgDatabase,
    private readonly campaignRepository: CampaignRepository,
  ) {}

  private readonly logger = new Logger(UpdateCampaignHandler.name);

  async execute(command: UpdateCampaignCommand): Promise<UpdateCampaignResult> {
    this.logger.log('Updating campaign...', { command });

    const result = await this.db.transaction(
      async (tx): Promise<UpdateCampaignResult> => {
        const campaign = await this.campaignRepository.findById(command.id, {
          txClient: tx,
          lock: {
            strength: 'update',
            lockConfig: { noWait: true },
          },
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

        if (campaign.name === command.name) {
          this.logger.log(
            `Campaign with id ${command.id} already has the name '${command.name}'. No update needed.`,
          );
          return {
            ...campaign,
          };
        }

        const updatedCampaign = await this.campaignRepository.update(
          command.id,
          { name: command.name, version: campaign.version },
          { txClient: tx },
        );
        this.logger.log('Campaign updated successfully.', updatedCampaign);

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
      },
    );

    return result;
  }
}
