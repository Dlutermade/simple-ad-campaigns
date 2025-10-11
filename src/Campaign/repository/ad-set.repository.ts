import { Inject, Injectable, Logger } from '@nestjs/common';
import { adSetsTable, campaignsTable } from '@src/db/schema';
import {
  DRIZZLE_PROVIDER,
  PgDatabase,
  PgTransactionClient,
} from '@src/libs/drizzle.module';
import { and, eq, not, sql } from 'drizzle-orm';
import { LockConfig, LockStrength } from 'drizzle-orm/pg-core';

@Injectable()
export class AdSetRepository {
  constructor(@Inject(DRIZZLE_PROVIDER) private readonly db: PgDatabase) {}

  private readonly Logger = new Logger(AdSetRepository.name);

  async findManyByCampaignId(
    campaignId: string,
    options?: {
      txClient?: PgTransactionClient;
      lock?: {
        strength: LockStrength;
        lockConfig?: LockConfig;
      };
    },
  ) {
    try {
      this.Logger.log(`Fetching ad sets for campaign ID: ${campaignId}`);
      const dbClient = options?.txClient ?? this.db;

      const sql = dbClient
        .select()
        .from(adSetsTable)
        .where(
          and(
            eq(adSetsTable.campaignId, campaignId),
            not(eq(adSetsTable.status, 'Deleted')),
          ),
        );

      const adSets = await (options?.lock
        ? sql.for(options.lock.strength, options.lock.lockConfig)
        : sql);

      this.Logger.log(
        `Fetched ${adSets.length} ad sets for campaign ID: ${campaignId}`,
      );

      return adSets;
    } catch (error) {
      this.Logger.error(
        `Error fetching ad sets for campaign ID: ${campaignId}`,
        error,
      );
      throw error;
    }
  }

  async findById(
    adSetId: string,
    options?: {
      txClient?: PgTransactionClient;
      lock?: {
        strength: LockStrength;
        lockConfig?: LockConfig;
      };
    },
  ): Promise<undefined | typeof adSetsTable.$inferSelect> {
    try {
      this.Logger.log(`Fetching ad set with ID: ${adSetId}`);
      const dbClient = options?.txClient ?? this.db;

      const sql = dbClient
        .select()
        .from(adSetsTable)
        .where(
          and(
            eq(adSetsTable.id, adSetId),
            not(eq(adSetsTable.status, 'Deleted')),
          ),
        );

      const [adSet] = await (options?.lock
        ? sql.for(options.lock.strength, options.lock.lockConfig)
        : sql);

      if (adSet) {
        this.Logger.log(`Ad set found with ID: ${adSetId}`);
      } else {
        this.Logger.log(`No ad set found with ID: ${adSetId}`);
      }

      return adSet;
    } catch (error) {
      this.Logger.error(`Error fetching ad set with ID: ${adSetId}`, error);
      throw error;
    }
  }

  async create(
    data: {
      campaignId: string;
      name: string;
      budget: number;
    },
    options?: { txClient?: PgTransactionClient },
  ) {
    try {
      this.Logger.log(`Creating ad set for campaign ID: ${data.campaignId}`);
      const dbClient = options?.txClient ?? this.db;

      const [adSet] = await dbClient
        .insert(adSetsTable)
        .values({
          campaignId: data.campaignId,
          name: data.name,
          budget: data.budget,
          status: 'Paused',
        })
        .returning();

      await dbClient
        .update(campaignsTable)
        .set({
          updatedAt: new Date(),
          version: sql`${campaignsTable.version} + 1`,
        })
        .where(eq(campaignsTable.id, data.campaignId));

      this.Logger.log(
        `Ad set created with ID: ${adSet.id} for campaign ID: ${data.campaignId}`,
      );

      return adSet;
    } catch (error) {
      this.Logger.error(
        `Error creating ad set for campaign ID: ${data.campaignId}`,
        error,
      );
      throw error;
    }
  }

  async update(
    adSetId: string,
    data: { name: string },
    options?: { txClient?: PgTransactionClient },
  ) {
    try {
      this.Logger.log(`Updating ad set with ID: ${adSetId}`);
      const dbClient = options?.txClient ?? this.db;

      const [adSet] = await dbClient
        .update(adSetsTable)
        .set({
          name: data.name,
        })
        .where(eq(adSetsTable.id, adSetId))
        .returning();

      await dbClient
        .update(campaignsTable)
        .set({
          updatedAt: new Date(),
          version: sql`${campaignsTable.version} + 1`,
        })
        .where(eq(campaignsTable.id, adSet.campaignId));

      this.Logger.log(`Ad set updated with ID: ${adSetId}`);

      return adSet;
    } catch (error) {
      this.Logger.error(`Error updating ad set with ID: ${adSetId}`, error);
      throw error;
    }
  }
}
