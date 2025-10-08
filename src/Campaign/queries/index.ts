import { FindAllCampaignsHandler } from './find-all-campaigns.handler';
import { FindCampaignByIdHandler } from './find-campaign-by-id.handler';

export * from './find-all-campaigns.query';
export * from './find-campaign-by-id.query';

export const queryHandlers = [FindAllCampaignsHandler, FindCampaignByIdHandler];
