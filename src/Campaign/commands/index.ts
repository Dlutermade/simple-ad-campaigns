import { AdjustCampaignBudgetHandler } from './adjust-campaign-budget.handler';
import { CreateAdSetHandler } from './create-ad-set.handler';
import { CreateCampaignHandler } from './create-campaign.handler';
import { SwitchAdSetStatusHandler } from './switch-ad-set-status.handler';
import { SwitchCampaignStatusHandler } from './switch-campaign-status.handler';
import { UpdateAdSetHandler } from './update-ad-set.handler';
import { UpdateCampaignHandler } from './update-campaign.handler';

/**
 * Campaign Commands
 */

export * from './adjust-campaign-budget.command';
export * from './adjust-campaign-budget.result';

export * from './create-campaign.command';
export * from './create-campaign.result';

export * from './switch-campaign-status.command';
export * from './switch-campaign-status.result';

export * from './update-campaign.command';
export * from './update-campaign.result';

/**
 * AdSet Commands
 */
export * from './create-ad-set.command';
export * from './create-ad-set.result';

export * from './switch-ad-set-status.command';
export * from './switch-ad-set-status.result';

export * from './update-ad-set.command';
export * from './update-ad-set.result';

export const commandHandlers = [
  // Campaign Handlers
  AdjustCampaignBudgetHandler,
  CreateCampaignHandler,
  SwitchCampaignStatusHandler,
  UpdateCampaignHandler,
  // AdSet Handlers
  CreateAdSetHandler,
  SwitchAdSetStatusHandler,
  UpdateAdSetHandler,
];
