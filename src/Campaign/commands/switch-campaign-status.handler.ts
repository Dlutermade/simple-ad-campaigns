import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SwitchCampaignStatusCommand } from './switch-campaign-status.command';
import { SwitchCampaignStatusResult } from './switch-campaign-status.result';
import { NotImplementedException } from '@nestjs/common';

@CommandHandler(SwitchCampaignStatusCommand)
export class SwitchCampaignStatusHandler
  implements
    ICommandHandler<SwitchCampaignStatusCommand, SwitchCampaignStatusResult>
{
  async execute(
    command: SwitchCampaignStatusCommand,
  ): Promise<SwitchCampaignStatusResult> {
    throw new NotImplementedException();
  }
}
