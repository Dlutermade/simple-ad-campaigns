import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class DeleteAdRequest {
  @ApiProperty({
    description: 'Version of the Ad for concurrency control',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  public readonly version: number;
}
