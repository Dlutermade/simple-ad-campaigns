import { CreateCampaignHandler } from './create-campaign.handler';

export * from './create-campaign.command';
export * from './create-campaign.result';

export const commandHandlers = [CreateCampaignHandler];
