import { Module } from '@nestjs/common';
import { queryHandlers } from './queries';
import { CampaignController } from './controllers/campaign.controller';
import { commandHandlers } from './commands';
import { CampaignRepository } from './repository/campaign.repository';

@Module({
  imports: [...queryHandlers, ...commandHandlers, CampaignRepository],
  controllers: [CampaignController],
  providers: [],
})
export class CampaignModule {}
