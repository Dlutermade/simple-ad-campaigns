import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class UpdateAdSetRequest {
  @ApiProperty({
    description: 'Name of the ad set',
    example: 'Holiday Ad Set',
  })
  @IsString()
  @IsNotEmpty()
  public readonly name: string;

  @ApiProperty({
    type: Number,
    description: 'Version number for optimistic concurrency control',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  public readonly version: number;
}
