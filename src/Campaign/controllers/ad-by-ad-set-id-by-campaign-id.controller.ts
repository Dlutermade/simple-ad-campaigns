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
  CreateAdRequest,
  CreateAdResponse,
  SwitchAdStatusRequest,
  SwitchAdStatusResponse,
  UpdateAdRequest,
  UpdateAdResponse,
} from '../dtos';
import {
  CreateAdCommand,
  CreateAdResult,
  DeleteAdCommand,
  SwitchAdStatusCommand,
  SwitchAdStatusResult,
  UpdateAdCommand,
  UpdateAdResult,
} from '../commands';

@ApiTags('AdSets')
@Controller('campaigns/:campaignId/ad_sets/:adSetId/ad')
export class AdSetByCampaignIdController {
  constructor(private readonly commandBus: CommandBus) {}

  @ApiResponse({
    status: 201,
    description: 'Ad created successfully',
    type: CreateAdResponse,
  })
  @Post()
  createAd(
    @Param('campaignId') campaignId: string,
    @Param('adSetId') adSetId: string,
    @Body() body: CreateAdRequest,
  ) {
    const command = new CreateAdCommand(
      campaignId,
      adSetId,
      body.name,
      body.content,
      body.creative,
      body.version,
    );
    return this.commandBus.execute<CreateAdCommand, CreateAdResult>(command);
  }

  @ApiResponse({
    status: 200,
    description: 'Ad updated successfully',
    type: UpdateAdResponse,
  })
  @Put(':adId')
  updateAd(
    @Param('campaignId') campaignId: string,
    @Param('adSetId') adSetId: string,
    @Param('adId') adId: string,
    @Body() body: UpdateAdRequest,
  ) {
    const command = new UpdateAdCommand(
      campaignId,
      adSetId,
      adId,
      body.name,
      body.content,
      body.creative,
      body.version,
    );
    return this.commandBus.execute<UpdateAdCommand, UpdateAdResult>(command);
  }

  @ApiResponse({
    status: 200,
    description: 'Ad updated successfully',
    type: SwitchAdStatusResponse,
  })
  @Patch(':adId/status')
  switchAdStatus(
    @Param('campaignId') campaignId: string,
    @Param('adSetId') adSetId: string,
    @Param('adId') adId: string,
    @Body() body: SwitchAdStatusRequest,
  ) {
    const command = new SwitchAdStatusCommand(
      campaignId,
      adSetId,
      adId,
      body.status,
      body.version,
    );
    return this.commandBus.execute<SwitchAdStatusCommand, SwitchAdStatusResult>(
      command,
    );
  }

  @ApiResponse({
    status: 200,
    description: 'Ad deleted successfully',
  })
  @Delete(':adId')
  deleteAd(
    @Param('campaignId') campaignId: string,
    @Param('adSetId') adSetId: string,
    @Param('adId') adId: string,
    @Body() body: { version: number },
  ) {
    const command = new DeleteAdCommand(
      campaignId,
      adSetId,
      adId,
      body.version,
    );
    return this.commandBus.execute<DeleteAdCommand, void>(command);
  }
}
