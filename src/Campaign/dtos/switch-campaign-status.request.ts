import { ApiProperty } from '@nestjs/swagger';

export class SwitchCampaignStatusRequest {
  @ApiProperty({
    type: String,
    enum: ['Paused', 'Active'],
    description: 'New status for the campaign',
    example: 'Active',
  })
  public readonly status: 'Paused' | 'Active';

  @ApiProperty({
    type: Number,
    description: 'Version number for optimistic concurrency control',
    example: 1,
  })
  public readonly version: number;
}
