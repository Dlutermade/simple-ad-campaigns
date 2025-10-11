import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateCampaignCommand } from './create-campaign.command';
import { Logger } from '@nestjs/common';
import { CampaignRepository } from '../repository/campaign.repository';
import { CreateCampaignResult } from './create-campaign.result';

@CommandHandler(CreateCampaignCommand)
export class CreateCampaignHandler
  implements ICommandHandler<CreateCampaignCommand, CreateCampaignResult>
{
  constructor(private readonly campaignRepository: CampaignRepository) {}

  private readonly logger = new Logger(CreateCampaignHandler.name);

  async execute(command: CreateCampaignCommand) {
    this.logger.log('Creating a new campaign...', command);

    const campaign = await this.campaignRepository.create({
      name: command.name,
      budget: command.budget,
    });

    this.logger.log('Campaign created successfully.', campaign);
    return campaign;
  }
}
