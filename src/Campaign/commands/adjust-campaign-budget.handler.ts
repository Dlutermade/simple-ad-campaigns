import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AdjustCampaignBudgetCommand } from './adjust-campaign-budget.command';
import { AdjustCampaignBudgetResult } from './adjust-campaign-budget.result';
import { NotImplementedException } from '@nestjs/common';

@CommandHandler(AdjustCampaignBudgetCommand)
export class AdjustCampaignBudgetHandler
  implements
    ICommandHandler<AdjustCampaignBudgetCommand, AdjustCampaignBudgetResult>
{
  async execute(
    command: AdjustCampaignBudgetCommand,
  ): Promise<AdjustCampaignBudgetResult> {
    throw new NotImplementedException('Not implemented yet');
  }
}
