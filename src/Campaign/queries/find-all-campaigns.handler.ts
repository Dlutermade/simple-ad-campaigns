import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FindAllCampaignsQuery } from './find-all-campaigns.query';
import {
  DRIZZLE_PROVIDER,
  DrizzleProviderType,
} from '@src/libs/drizzle.module';
import { Inject, Logger } from '@nestjs/common';
import { campaignsTable } from '@src/db/schema';

@QueryHandler(FindAllCampaignsQuery)
export class FindAllCampaignsHandler
  implements IQueryHandler<FindAllCampaignsQuery>
{
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: DrizzleProviderType,
  ) {}

  private readonly logger = new Logger(FindAllCampaignsHandler.name);

  async execute(query: FindAllCampaignsQuery): Promise<any> {
    this.logger.log('Executing FindAllCampaignsQuery', query);

    const [list, count] = await this.db.transaction(async (tx) => {
      this.logger.log('Transaction started');

      return Promise.all([
        tx.query.campaignsTable.findMany({
          with: { adSets: { with: { ads: true } } },
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
