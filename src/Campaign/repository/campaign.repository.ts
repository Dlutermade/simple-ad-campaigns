import { Inject, Injectable, Logger } from '@nestjs/common';
import { campaignsTable } from '@src/db/schema';
import {
  DRIZZLE_PROVIDER,
  PgDatabase,
  PgTransactionClient,
} from '@src/libs/drizzle.module';
import { and, eq, sql } from 'drizzle-orm';
import { LockConfig, LockStrength } from 'drizzle-orm/pg-core';

@Injectable()
export class CampaignRepository {
  constructor(@Inject(DRIZZLE_PROVIDER) private readonly db: PgDatabase) {}

  private readonly Logger = new Logger(CampaignRepository.name);

  async create(
    data: Pick<typeof campaignsTable.$inferInsert, 'name' | 'budget'>,
    options?: { txClient?: PgTransactionClient },
  ) {
    try {
      this.Logger.log('Creating a new campaign', data);

      const dbClient = options?.txClient ?? this.db;

      const [campaign] = await dbClient
        .insert(campaignsTable)
        .values({
          name: data.name,
          budget: data.budget,
          status: 'Paused',
        })
        .returning();

      this.Logger.log('Campaign created', campaign);

      return campaign;
    } catch (error) {
      this.Logger.error('Cannot create campaign', error);
      throw error;
    }
  }

  async findById(
    id: string,
    options?: {
      txClient?: PgTransactionClient;
      lock?: {
        strength: LockStrength;
        lockConfig?: LockConfig;
      };
    },
  ): Promise<typeof campaignsTable.$inferSelect | undefined> {
    try {
      this.Logger.log(`Finding campaign by id: ${id}`);

      const dbClient = options?.txClient ?? this.db;

      const sql = dbClient
        .select()
        .from(campaignsTable)
        .where(eq(campaignsTable.id, id));

      const [campaign] = await (options?.lock
        ? sql.for(options.lock.strength, options.lock.lockConfig)
        : sql);

      this.Logger.log(`Found campaign by id: ${id}`, campaign);

      return campaign;
    } catch (error) {
      this.Logger.error(`Error finding campaign by id: ${id}`, error);
      throw error;
    }
  }

  async update(
    id: string,
    data: Partial<
      Pick<typeof campaignsTable.$inferSelect, 'name' | 'budget' | 'status'>
    >,
    options?: { txClient?: PgTransactionClient },
  ): Promise<typeof campaignsTable.$inferSelect | undefined> {
    try {
      this.Logger.log(`Updating campaign id: ${id}`, data);

      const dbClient = options?.txClient ?? this.db;

      const [campaign] = await dbClient
        .update(campaignsTable)
        .set({
          name: data.name,
          budget: data.budget,
          status: data.status,
          version: sql`${campaignsTable.version} + 1`,
          updatedAt: new Date(),
        })
        .where(and(eq(campaignsTable.id, id)))
        .returning();

      this.Logger.log(`Updated campaign id: ${id}`, campaign);

      return campaign;
    } catch (error) {
      this.Logger.error(`Cannot update campaign id: ${id}`, error);
      throw error;
    }
  }
}
