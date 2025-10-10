import { Inject, Logger, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DRIZZLE_PROVIDER, PgDatabase } from '@src/libs/drizzle.module';
import { FindCampaignByIdQuery } from './find-campaign-by-id.query';
import { FindCampaignByIdResult } from './find-campaign-by-id.result';

@QueryHandler(FindCampaignByIdQuery)
export class FindCampaignByIdHandler
  implements IQueryHandler<FindCampaignByIdQuery, FindCampaignByIdResult>
{
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: PgDatabase,
  ) {}

  private readonly logger = new Logger(FindCampaignByIdHandler.name);

  async execute(query: FindCampaignByIdQuery) {
    this.logger.log('Executing FindCampaignByIdQuery', query);

    const campaign = await this.db.query.campaignsTable.findFirst({
      where: (table, { eq }) => eq(table.id, query.id),
      with: { adSets: { with: { ads: true } } },
    });

    if (!campaign) {
      this.logger.warn(`Campaign with id ${query.id} not found`);
      throw new NotFoundException(
        {
          errorCode: 'CAMPAIGN_NOT_FOUND',
          id: query.id,
        },
        `Campaign with id ${query.id} not found`,
      );
    }

    this.logger.log(`Found campaign with id ${query.id}`);

    return campaign;
  }
}
