import { Inject, Injectable, Logger } from '@nestjs/common';
import { adsTable } from '@src/db/schema';
import {
  DRIZZLE_PROVIDER,
  PgDatabase,
  PgTransactionClient,
} from '@src/libs/drizzle.module';
import { and, eq, not } from 'drizzle-orm';
import { LockConfig, LockStrength } from 'drizzle-orm/pg-core';

@Injectable()
export class AdRepository {
  constructor(@Inject(DRIZZLE_PROVIDER) private readonly db: PgDatabase) {}

  private readonly Logger = new Logger(AdRepository.name);

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
}
