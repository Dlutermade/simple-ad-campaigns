import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FindAllCampaignsQuery } from './find-all-campaigns.query';
import { DRIZZLE_PROVIDER, PgDatabase } from '@src/libs/drizzle.module';
import { Inject, Logger } from '@nestjs/common';
import { campaignsTable } from '@src/db/schema';
import { FindAllCampaignsResult } from './find-all-campaigns.result';

@QueryHandler(FindAllCampaignsQuery)
export class FindAllCampaignsHandler
  implements IQueryHandler<FindAllCampaignsQuery, FindAllCampaignsResult>
{
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: PgDatabase,
  ) {}

  private readonly logger = new Logger(FindAllCampaignsHandler.name);

  async execute(query: FindAllCampaignsQuery) {
    this.logger.log('Executing FindAllCampaignsQuery', query);

    const [list, count] = await this.db.transaction(async (tx) => {
      this.logger.log('Transaction started');

      return Promise.all([
        tx.query.campaignsTable.findMany({
          where(fields, { not, eq }) {
            return not(eq(fields.status, 'Deleted'));
          },
          with: {
            adSets: {
              with: {
                ads: {
                  where(fields, { not, eq }) {
                    return not(eq(fields.status, 'Deleted'));
                  },
                },
              },
              where(fields, { not, eq }) {
                return not(eq(fields.status, 'Deleted'));
              },
            },
          },
          limit: query.take,
          offset: query.skip,
        }),
        tx.$count(campaignsTable),
      ]);
    });
    this.logger.log('Transaction ended');

    this.logger.log(`Found ${list.length} campaigns out of ${count} total`);

    return { list, count, query };
  }
}
