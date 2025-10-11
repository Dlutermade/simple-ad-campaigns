import { ApiProperty } from '@nestjs/swagger';

export class SwitchCampaignStatusResponse {
  @ApiProperty({
    type: String,
    description: 'ID of the updated campaign',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  public readonly id: string;

  @ApiProperty({
    type: String,
    description: 'Name of the updated campaign',
    example: 'Summer Sale Campaign',
  })
  public readonly name: string;

  @ApiProperty({
    type: Number,
    description: 'Budget allocated for the campaign',
    example: 5000,
  })
  public readonly budget: number;

  @ApiProperty({
    enum: ['Paused', 'Active', 'Completed'],
    description: 'Current status of the campaign',
    example: 'Paused',
  })
  public readonly status: 'Paused' | 'Active' | 'Deleted';

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Timestamp when the campaign was created',
    example: '2024-01-01T12:00:00Z',
  })
  public readonly createdAt: Date;

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Timestamp when the campaign was last updated',
    example: '2024-01-02T12:00:00Z',
  })
  public readonly updatedAt: Date;

  @ApiProperty({
    type: Number,
    description: 'Version number for optimistic concurrency control',
    example: 1,
  })
  public readonly version: number;

  constructor(partial: Partial<SwitchCampaignStatusResponse>) {
    Object.assign(this, partial);
  }
}
