import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateAdRequest {
  @ApiProperty({
    description: 'Name of the ad',
    example: 'ad-1',
  })
  @IsString()
  @IsNotEmpty()
  public readonly name: string;

  @ApiProperty({
    description: 'Content of the ad',
    example: 'This is the content of the ad',
  })
  @IsString()
  @IsNotEmpty()
  public readonly content: string;

  @ApiProperty({
    description: 'Creative asset URL of the ad',
    example: 'https://example.com/ad-1.jpg',
  })
  @IsString()
  @IsNotEmpty()
  public readonly creative: string;

  @ApiProperty({
    description: 'Version number for optimistic concurrency control',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  public readonly version: number;
}
