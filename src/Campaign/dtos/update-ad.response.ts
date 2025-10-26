import { ApiProperty } from '@nestjs/swagger';

export class UpdateAdResponse {
  @ApiProperty({
    type: String,
    description: 'ID of the updated ad',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  public readonly id: string;

  @ApiProperty({
    type: String,
    description: 'ID of the ad set the ad belongs to',
    example: '987e6543-e21b-12d3-a456-426614174000',
  })
  public readonly adSetId: string;

  @ApiProperty({
    type: String,
    description: 'Name of the updated ad',
    example: 'Summer Sale Campaign',
  })
  public readonly name: string;

  @ApiProperty({
    type: String,
    description: 'Content of the updated ad',
    example: 'This is the content of the ad',
  })
  public readonly content: string;

  @ApiProperty({
    type: String,
    description: 'Creative asset URL of the updated ad',
    example: 'https://example.com/ad-1.jpg',
  })
  public readonly creative: string;

  @ApiProperty({
    enum: ['Paused', 'Active', 'Completed'],
    description: 'Current status of the ad',
    example: 'Paused',
  })
  public readonly status: 'Paused' | 'Active' | 'Deleted';

  constructor(partial: Partial<UpdateAdResponse>) {
    Object.assign(this, partial);
  }
}
