import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateCampaignRequest {
  @ApiProperty({
    description: 'Name of the campaign',
    example: 'Summer Sale Campaign',
  })
  @IsString()
  @IsNotEmpty()
  public readonly name: string;
}
