import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateCampaignCommand } from './create-campaign.command';
import { NotImplementedException } from '@nestjs/common';
import { CampaignRepository } from '../repository/campaign.repository';

@CommandHandler(CreateCampaignCommand)
export class CreateCampaignHandler
  implements ICommandHandler<CreateCampaignCommand>
{
  constructor(campaignRepository: CampaignRepository) {}

  async execute(command: CreateCampaignCommand) {
    throw new NotImplementedException();
  }
}
