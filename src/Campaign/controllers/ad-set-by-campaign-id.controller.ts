import { Body, Controller, Param, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateAdSetRequest, CreateAdSetResponse } from '../dtos';
import { CreateAdSetCommand, CreateAdSetResult } from '../commands';

@ApiTags('AdSets')
@Controller('campaigns/:campaignId/ad_sets')
export class AdSetByCampaignIdController {
  constructor(private readonly commandBus: CommandBus) {}

  @ApiResponse({
    status: 201,
    description: 'Ad Set created successfully',
    type: CreateAdSetResponse,
  })
  @Post()
  createAdSet(
    @Param('campaignId') campaignId: string,
    @Body() body: CreateAdSetRequest,
  ) {
    const command = new CreateAdSetCommand(campaignId, body.name, body.budget);
    return this.commandBus.execute<CreateAdSetCommand, CreateAdSetResult>(
      command,
    );
  }
}
