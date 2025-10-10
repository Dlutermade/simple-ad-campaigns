import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateCampaignCommand } from './create-campaign.command';
import { NotImplementedException } from '@nestjs/common';

@CommandHandler(CreateCampaignCommand)
export class CreateCampaignHandler
  implements ICommandHandler<CreateCampaignCommand>
{
  constructor() {}

  async execute(command: CreateCampaignCommand) {
    throw new NotImplementedException();
  }
}
