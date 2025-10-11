import { Module } from '@nestjs/common';
import { CampaignController } from './controllers/campaign.controller';
import { AdSetByCampaignIdController } from './controllers/ad-set-by-campaign-id.controller';

import { CampaignRepository } from './repository/campaign.repository';
import { AdSetRepository } from './repository/ad-set.repository';
import { AdRepository } from './repository/ad.repository';

import { queryHandlers } from './queries';
import { commandHandlers } from './commands';

@Module({
  imports: [],
  controllers: [CampaignController, AdSetByCampaignIdController],
  providers: [
    ...queryHandlers,
    ...commandHandlers,
    CampaignRepository,
    AdSetRepository,
    AdRepository,
  ],
})
export class CampaignModule {}
