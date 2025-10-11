import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsInt, Min } from 'class-validator';

export class CreateAdSetRequest {
  @ApiProperty({
    description: 'Name of the ad set',
    example: 'ad-set-1',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Budget for the ad set in cents',
    example: 5000,
  })
  @IsNumber()
  @IsInt()
  @IsNotEmpty()
  @Min(0)
  budget: number;
}
