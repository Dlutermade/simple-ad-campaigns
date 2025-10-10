import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiNotFoundResponse, ApiResponse } from '@nestjs/swagger';
import {
  FindAllCampaignsQuery,
  FindAllCampaignsResult,
  FindCampaignByIdQuery,
  FindCampaignByIdResult,
} from '../queries';
import {
  CreateCampaignCommand,
  CreateCampaignResult,
  SwitchCampaignStatusCommand,
  SwitchCampaignStatusResult,
} from '../commands';
import {
  CreateCampaignRequest,
  CreateCampaignResponse,
  GetAllCampaignsRequest,
  GetAllCampaignsResponse,
  GetCampaignByIdResponse,
  SwitchCampaignStatusRequest,
  SwitchCampaignStatusResponse,
} from '../dtos';

@Controller('campaigns')
export class CampaignController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @ApiResponse({
    status: 200,
    description: 'List of campaigns retrieved successfully',
    type: GetAllCampaignsResponse,
  })
  @Get()
  getAllCampaigns(
    @Query() queryParams: GetAllCampaignsRequest,
  ): Promise<GetAllCampaignsResponse> {
    const query = new FindAllCampaignsQuery(queryParams.take, queryParams.skip);
    return this.queryBus.execute<FindAllCampaignsQuery, FindAllCampaignsResult>(
      query,
    );
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
  getCampaignById(@Param('id') id: string): Promise<GetCampaignByIdResponse> {
    const query = new FindCampaignByIdQuery(id);
    return this.queryBus.execute<FindCampaignByIdQuery, FindCampaignByIdResult>(
      query,
    );
  }

  @ApiResponse({
    status: 201,
    description: 'Campaign created successfully',
    type: CreateCampaignResponse,
  })
  @Post()
  createCampaign(@Body() body: CreateCampaignRequest) {
    const command = new CreateCampaignCommand(body.name, body.budget);
    return this.commandBus.execute<CreateCampaignCommand, CreateCampaignResult>(
      command,
    );
  }

  @ApiResponse({
    status: 200,
    description: 'Campaign status switched successfully',
    type: SwitchCampaignStatusResponse,
  })
  @Patch(':id/status')
  switchStatus(
    @Param('id') id: string,
    @Body() body: SwitchCampaignStatusRequest,
  ) {
    const command = new SwitchCampaignStatusCommand(
      id,
      body.status,
      body.version,
    );
    return this.commandBus.execute<
      SwitchCampaignStatusCommand,
      SwitchCampaignStatusResult
    >(command);
  }
}
