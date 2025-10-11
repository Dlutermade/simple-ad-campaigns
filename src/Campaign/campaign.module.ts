import { Module } from '@nestjs/common';
import { queryHandlers } from './queries';
import { CampaignController } from './controllers/campaign.controller';
import { commandHandlers } from './commands';
import { CampaignRepository } from './repository/campaign.repository';
import { AdSetRepository } from './repository/ad-set.repository';
import { AdSetByCampaignIdController } from './controllers/ad-set-by-campaign-id.controller';

@Module({
  imports: [
    ...queryHandlers,
    ...commandHandlers,
    CampaignRepository,
    AdSetRepository,
  ],
  controllers: [CampaignController, AdSetByCampaignIdController],
  providers: [],
})
export class CampaignModule {}
