import { IQueryResult } from '@nestjs/cqrs';
import { GetAllCampaignsResponse } from '../dtos';

/**
 * 示意用架構
 * 基本上 query result 會等價於 response dto, 因此並無額外重複定義的必要
 */
export class FindAllCampaignsResult
  extends GetAllCampaignsResponse
  implements IQueryResult {}
