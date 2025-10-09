import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min } from 'class-validator';

export class GetAllCampaignsRequest {
  @ApiPropertyOptional({
    description: 'Number of campaigns to retrieve',
    example: 10,
    minimum: 1,
    default: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  public readonly take?: number;

  @ApiPropertyOptional({
    description: 'Number of campaigns to skip',
    example: 0,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  public readonly skip?: number;
}
