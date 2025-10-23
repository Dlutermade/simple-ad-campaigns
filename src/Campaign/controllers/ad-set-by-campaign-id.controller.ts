import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  CreateAdSetRequest,
  CreateAdSetResponse,
  DeleteAdSetRequest,
  SwitchAdSetStatusRequest,
  SwitchAdSetStatusResponse,
  UpdateAdSetRequest,
  UpdateAdSetResponse,
} from '../dtos';
import {
  CreateAdSetCommand,
  CreateAdSetResult,
  DeleteAdSetCommand,
  SwitchAdSetStatusCommand,
  SwitchAdSetStatusResult,
  UpdateAdSetCommand,
  UpdateAdSetResult,
} from '../commands';

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
    const command = new CreateAdSetCommand(
      campaignId,
      body.name,
      body.budget,
      body.version,
    );
    return this.commandBus.execute<CreateAdSetCommand, CreateAdSetResult>(
      command,
    );
  }

  @ApiResponse({
    status: 200,
    description: 'Ad Set updated successfully',
    type: UpdateAdSetResponse,
  })
  @Put(':adSetId')
  updateAdSet(
    @Param('campaignId') campaignId: string,
    @Param('adSetId') adSetId: string,
    @Body() body: UpdateAdSetRequest,
  ) {
    const command = new UpdateAdSetCommand(
      campaignId,
      adSetId,
      body.name,
      body.version,
    );
    return this.commandBus.execute<UpdateAdSetCommand, UpdateAdSetResult>(
      command,
    );
  }

  @ApiResponse({
    status: 200,
    description: 'Ad Set updated successfully',
    type: SwitchAdSetStatusResponse,
  })
  @Patch(':adSetId/status')
  switchAdSetStatus(
    @Param('campaignId') campaignId: string,
    @Param('adSetId') adSetId: string,
    @Body() body: SwitchAdSetStatusRequest,
  ) {
    const command = new SwitchAdSetStatusCommand(
      campaignId,
      adSetId,
      body.status,
      body.version,
    );
    return this.commandBus.execute<
      SwitchAdSetStatusCommand,
      SwitchAdSetStatusResult
    >(command);
  }

  @Delete(':adSetId')
  @ApiResponse({
    status: 200,
    description: 'Ad Set deleted successfully',
  })
  deleteAdSet(
    @Param('campaignId') campaignId: string,
    @Param('adSetId') adSetId: string,
    @Body() body: DeleteAdSetRequest,
  ) {
    const command = new DeleteAdSetCommand(campaignId, adSetId, body.version);
    return this.commandBus.execute<DeleteAdSetCommand, void>(command);
  }
}
