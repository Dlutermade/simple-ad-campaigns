import { ApiProperty } from '@nestjs/swagger';

export class CreateAdSetResponse {
  @ApiProperty({
    type: String,
    description: 'ID of the created ad set',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  public readonly id: string;

  @ApiProperty({
    type: String,
    description: 'ID of the campaign the ad set belongs to',
    example: '987e6543-e21b-12d3-a456-426614174000',
  })
  public readonly campaignId: string;

  @ApiProperty({
    type: String,
    description: 'Name of the created ad set',
    example: 'Summer Sale Campaign',
  })
  public readonly name: string;

  @ApiProperty({
    type: Number,
    description: 'Budget allocated for the ad set',
    example: 5000,
  })
  public readonly budget: number;

  @ApiProperty({
    enum: ['Paused', 'Active', 'Completed'],
    description: 'Current status of the ad set',
    example: 'Paused',
  })
  public readonly status: 'Paused' | 'Active' | 'Deleted';

  constructor(partial: Partial<CreateAdSetResponse>) {
    Object.assign(this, partial);
  }
}
