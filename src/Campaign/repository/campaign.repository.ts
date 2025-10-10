import { Inject, Injectable, Logger } from '@nestjs/common';
import { campaignsTable } from '@src/db/schema';
import { DRIZZLE_PROVIDER, PgDatabase } from '@src/libs/drizzle.module';
import { eq } from 'drizzle-orm';

@Injectable()
export class CampaignRepository {
  constructor(@Inject(DRIZZLE_PROVIDER) private readonly db: PgDatabase) {}

  private readonly Logger = new Logger(CampaignRepository.name);

  async createCampaign(
    data: Pick<typeof campaignsTable.$inferInsert, 'name' | 'budget'>,
  ) {
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

  async findById(id: string) {
    this.Logger.log(`Finding campaign by id: ${id}`);

    const sql = this.db
      .select()
      .from(campaignsTable)
      .for('update')
      .where(eq(campaignsTable.id, id));

    this.Logger.log('Campaign found', campaign);
  }
}
