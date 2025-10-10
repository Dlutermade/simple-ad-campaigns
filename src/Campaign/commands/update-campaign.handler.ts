import { Inject, NotImplementedException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DRIZZLE_PROVIDER, PgDatabase } from '@src/libs/drizzle.module';
import { CampaignRepository } from '../repository/campaign.repository';
import { UpdateCampaignCommand } from './update-campaign.command';
import { UpdateCampaignResult } from './update-campaign.result';

@CommandHandler(UpdateCampaignCommand)
export class UpdateCampaignHandler
  implements ICommandHandler<UpdateCampaignCommand, UpdateCampaignResult>
{
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: PgDatabase,
    private readonly campaignRepository: CampaignRepository,
  ) {}

  async execute(command: UpdateCampaignCommand): Promise<UpdateCampaignResult> {
    throw new NotImplementedException();
  }
}
