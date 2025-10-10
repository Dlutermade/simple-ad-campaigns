import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateCampaignRequest {
  @ApiProperty({
    description: 'Name of the campaign',
    example: 'Summer Sale Campaign',
  })
  @IsString()
  @IsNotEmpty()
  public readonly name: string;

  @ApiProperty({
    description: 'Budget of the campaign in cents',
    example: 100000,
  })
  @IsNumber()
  @IsInt()
  @IsNotEmpty()
  @Min(0)
  public readonly budget: number;
}
