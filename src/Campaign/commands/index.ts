import { AdjustCampaignBudgetHandler } from './adjust-campaign-budget.handler';
import { CreateCampaignHandler } from './create-campaign.handler';
import { SwitchCampaignStatusHandler } from './switch-campaign-status.handler';

export * from './adjust-campaign-budget.command';
export * from './adjust-campaign-budget.result';

export * from './create-campaign.command';
export * from './create-campaign.result';

export * from './switch-campaign-status.command';
export * from './switch-campaign-status.result';

export const commandHandlers = [
  AdjustCampaignBudgetHandler,
  CreateCampaignHandler,
  SwitchCampaignStatusHandler,
];
