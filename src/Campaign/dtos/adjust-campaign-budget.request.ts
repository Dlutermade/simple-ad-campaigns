import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber } from 'class-validator';

export class AdjustCampaignBudgetRequest {
  @ApiProperty({
    description: 'Budget of the campaign in cents',
    example: 100000,
  })
  @IsNumber()
  @IsInt()
  @IsNotEmpty()
  public readonly adjustAmount: number;

  @ApiProperty({
    type: Number,
    description: 'Version number for optimistic concurrency control',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  public readonly version: number;
}
