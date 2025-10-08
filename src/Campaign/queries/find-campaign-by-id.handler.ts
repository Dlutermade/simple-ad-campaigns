import { Inject, Logger, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  DRIZZLE_PROVIDER,
  DrizzleProviderType,
} from '@src/libs/drizzle.module';
import { FindCampaignByIdQuery } from './find-campaign-by-id.query';

@QueryHandler(FindCampaignByIdQuery)
export class FindCampaignByIdHandler
  implements IQueryHandler<FindCampaignByIdQuery>
{
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: DrizzleProviderType,
  ) {}

  private readonly logger = new Logger(FindCampaignByIdHandler.name);

  async execute(query: FindCampaignByIdQuery): Promise<any> {
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

    return { campaign, query };
  }
}
