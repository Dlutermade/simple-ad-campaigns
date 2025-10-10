import { Module } from '@nestjs/common';
import { queryHandlers } from './queries';
import { CampaignController } from './controllers/campaign.controller';
import { commandHandlers } from './commands';
import { CampaignRepository } from './repository/campaign.repository';
import { AdSetRepository } from './repository/ad-set.repository';

@Module({
  imports: [
    ...queryHandlers,
    ...commandHandlers,
    CampaignRepository,
    AdSetRepository,
  ],
  controllers: [CampaignController],
  providers: [],
})
export class CampaignModule {}
