import { Module } from '@nestjs/common';
import { queryHandlers } from './queries';
import { CampaignController } from './controllers/campaign.controller';

@Module({
  imports: [...queryHandlers],
  controllers: [CampaignController],
  providers: [],
})
export class CampaignModule {}
