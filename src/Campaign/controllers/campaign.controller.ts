import { Controller, Get, Param, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiNotFoundResponse, ApiResponse } from '@nestjs/swagger';
import { FindAllCampaignsQuery, FindCampaignByIdQuery } from '../queries';
import {
  GetAllCampaignsRequest,
  GetAllCampaignsResponse,
  GetCampaignByIdResponse,
} from '../dtos';

@Controller('campaigns')
export class CampaignController {
  constructor(private readonly queryBus: QueryBus) {}

  @ApiResponse({
    status: 200,
    description: 'List of campaigns retrieved successfully',
    type: GetAllCampaignsResponse,
  })
  @Get()
  getAllCampaigns(@Query() queryParams: GetAllCampaignsRequest) {
    const query = new FindAllCampaignsQuery(queryParams.take, queryParams.skip);
    return this.queryBus.execute<FindAllCampaignsQuery>(query);
  }

  @ApiResponse({
    status: 200,
    description: 'Campaign retrieved successfully',
    type: GetCampaignByIdResponse,
  })
  @ApiNotFoundResponse({
    description: 'Campaign not found',
  })
  @Get(':id')
  getCampaignById(@Param('id') id: string) {
    const query = new FindCampaignByIdQuery(id);
    return this.queryBus.execute<FindCampaignByIdQuery>(query);
  }
}
