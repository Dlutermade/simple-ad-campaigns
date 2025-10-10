import { ApiProperty } from '@nestjs/swagger';

export class CreateCampaignResponse {
  @ApiProperty({
    description: 'ID of the created campaign',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  public readonly id: string;
}
