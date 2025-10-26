import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';

export class SwitchAdStatusRequest {
  @ApiProperty({
    type: String,
    enum: ['Active', 'Paused'],
    description: 'New status for the ad',
    example: 'Active',
  })
  @IsEnum(['Active', 'Paused'])
  @IsNotEmpty()
  public readonly status: 'Active' | 'Paused';

  @ApiProperty({
    type: Number,
    description: 'Version number for optimistic concurrency control',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  public readonly version: number;
}
