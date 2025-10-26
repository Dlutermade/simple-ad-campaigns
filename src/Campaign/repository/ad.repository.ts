import { Inject, Injectable, Logger } from '@nestjs/common';
import { adSetsTable, adsTable, campaignsTable } from '@src/db/schema';
import {
  DRIZZLE_PROVIDER,
  PgDatabase,
  PgTransactionClient,
} from '@src/libs/drizzle.module';
import { and, eq, inArray, not, sql } from 'drizzle-orm';
import { LockConfig, LockStrength } from 'drizzle-orm/pg-core';

@Injectable()
export class AdRepository {
  constructor(@Inject(DRIZZLE_PROVIDER) private readonly db: PgDatabase) {}

  private readonly Logger = new Logger(AdRepository.name);

  async findById(
    adId: string,
    options?: {
      txClient?: PgTransactionClient;
      lock?: {
        strength: LockStrength;
        lockConfig?: LockConfig;
      };
    },
  ): Promise<typeof adsTable.$inferSelect | undefined> {
    try {
      this.Logger.log(`Fetching ad with ID: ${adId}`);
      const dbClient = options?.txClient ?? this.db;

      const sql = dbClient.select().from(adsTable).where(eq(adsTable.id, adId));

      const [ad] = await (options?.lock
        ? sql.for(options.lock.strength, options.lock.lockConfig)
        : sql);

      if (ad) {
        this.Logger.log(`Fetched ad with ID: ${adId}`);
      } else {
        this.Logger.log(`Ad with ID: ${adId} not found`);
      }

      return ad;
    } catch (error) {
      this.Logger.error(`Error fetching ad with ID: ${adId}`, error);
      throw error;
    }
  }

  async findManyByAdSetId(
    adSetId: string,
    options?: {
      txClient?: PgTransactionClient;
      lock?: {
        strength: LockStrength;
        lockConfig?: LockConfig;
      };
    },
  ) {
    try {
      this.Logger.log(`Fetching ads for ad set ID: ${adSetId}`);
      const dbClient = options?.txClient ?? this.db;

      const sql = dbClient
        .select()
        .from(adsTable)
        .where(
          and(
            eq(adsTable.adSetId, adSetId),
            not(eq(adsTable.status, 'Deleted')),
          ),
        );

      const ads = await (options?.lock
        ? sql.for(options.lock.strength, options.lock.lockConfig)
        : sql);

      this.Logger.log(`Fetched ${ads.length} ads for ad set ID: ${adSetId}`);

      return ads;
    } catch (error) {
      this.Logger.error(`Error fetching ads for ad set ID: ${adSetId}`, error);
      throw error;
    }
  }

  async create(
    data: Pick<
      typeof adsTable.$inferInsert,
      'name' | 'adSetId' | 'content' | 'creative'
    >,
    options?: { txClient?: PgTransactionClient },
  ) {
    try {
      this.Logger.log('Creating a new ad', data);
      const dbClient = options?.txClient ?? this.db;

      const [ad] = await dbClient
        .insert(adsTable)
        .values({
          adSetId: data.adSetId,
          name: data.name,
          content: data.content,
          creative: data.creative,
          status: 'Paused',
        })
        .returning();

      await dbClient
        .update(campaignsTable)
        .set({
          updatedAt: new Date(),
          version: sql`${campaignsTable.version} + 1`,
        })
        .where(
          inArray(
            campaignsTable.id,
            dbClient
              .select({
                campaignId: adSetsTable.campaignId,
              })
              .from(adSetsTable)
              .where(eq(adSetsTable.id, data.adSetId)),
          ),
        );

      this.Logger.log(
        `Ad created with ID: ${ad.id} for ad set ID: ${data.adSetId}`,
      );

      return ad;
    } catch (error) {
      this.Logger.error(
        `Error creating ad for ad set ID: ${data.adSetId}`,
        error,
      );
      throw error;
    }
  }

  async update(
    adId: string,
    data: Partial<
      Pick<
        typeof adsTable.$inferInsert,
        'name' | 'content' | 'creative' | 'status'
      >
    >,
    options?: { txClient?: PgTransactionClient },
  ) {
    try {
      this.Logger.log(`Updating ad with ID: ${adId}`, data);
      const dbClient = options?.txClient ?? this.db;

      const [ad] = await dbClient
        .update(adsTable)
        .set({
          name: data.name,
          content: data.content,
          creative: data.creative,
          status: data.status,
        })
        .where(eq(adsTable.id, adId))
        .returning();

      await dbClient
        .update(campaignsTable)
        .set({
          updatedAt: new Date(),
          version: sql`${campaignsTable.version} + 1`,
        })
        .where(
          inArray(
            campaignsTable.id,
            dbClient
              .select({
                campaignId: adSetsTable.campaignId,
              })
              .from(adSetsTable)
              .where(eq(adSetsTable.id, ad.adSetId)),
          ),
        );

      this.Logger.log(`Ad with ID: ${adId} updated successfully`);

      return ad;
    } catch (error) {
      this.Logger.error(`Error updating ad with ID: ${adId}`, error);
      throw error;
    }
  }
}
