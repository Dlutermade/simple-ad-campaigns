import { IQueryResult } from '@nestjs/cqrs';
import { GetCampaignByIdResponse } from '../dtos';

/**
 * 示意用架構
 * 基本上 query result 會等價於 response dto, 因此並無額外重複定義的必要
 */
export class FindCampaignByIdResult
  extends GetCampaignByIdResponse
  implements IQueryResult {}
