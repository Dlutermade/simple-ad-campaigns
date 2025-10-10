import { Inject, Injectable, Logger } from '@nestjs/common';
import { campaignsTable } from '@src/db/schema';
import {
  DRIZZLE_PROVIDER,
  DrizzleProviderType,
} from '@src/libs/drizzle.module';

@Injectable()
export class CampaignRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleProviderType,
  ) {}

  private readonly Logger = new Logger(CampaignRepository.name);

  async createCampaign(
    data: Pick<typeof campaignsTable.$inferInsert, 'name' | 'budget'>,
  ): Promise<any> {
    this.Logger.log('Creating a new campaign', data);

    const [campaign] = await this.db
      .insert(campaignsTable)
      .values({
        name: data.name,
        budget: data.budget,
        status: 'Paused',
      })
      .returning();

    this.Logger.log('Campaign created', campaign);

    return campaign;
  }
}
