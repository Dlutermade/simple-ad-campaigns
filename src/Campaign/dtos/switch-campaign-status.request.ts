import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';

export class SwitchCampaignStatusRequest {
  @ApiProperty({
    type: String,
    enum: ['Paused', 'Active'],
    description: 'New status for the campaign',
    example: 'Active',
  })
  @IsEnum(['Paused', 'Active'])
  @IsNotEmpty()
  public readonly status: 'Paused' | 'Active';

  @ApiProperty({
    type: Number,
    description: 'Version number for optimistic concurrency control',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  public readonly version: number;
}
