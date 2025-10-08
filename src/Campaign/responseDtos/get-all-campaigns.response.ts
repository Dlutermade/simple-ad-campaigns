import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class Ad {
  @ApiProperty({
    type: 'string',
    format: 'uuid',
    example: '043f2f90-5b6d-4c3e-8f0e-2c2f2c2f2c2f',
    description: 'The unique identifier of the ad',
  })
  public readonly id: string;

  @ApiProperty({
    type: 'string',
    example: 'Ad Name',
    description: 'The name of the ad',
  })
  public readonly name: string;

  @ApiProperty({
    type: 'string',
    example: 'This is an ad content',
    description: 'The content of the ad',
  })
  public readonly content: string;

  @ApiProperty({
    enum: ['Active', 'Paused', 'Deleted'],
    example: 'Active',
    description: 'The status of the ad',
  })
  public readonly status: 'Active' | 'Paused' | 'Deleted';

  @ApiProperty({
    type: 'string',
    example: 'http://example.com/creative.jpg',
    description: 'The creative URL of the ad',
  })
  public readonly creative: string;

  constructor(
    id: string,
    name: string,
    content: string,
    status: 'Active' | 'Paused' | 'Deleted',
    creative: string,
  ) {
    this.id = id;
    this.name = name;
    this.content = content;
    this.status = status;
    this.creative = creative;
  }
}

class AdSet {
  @ApiProperty({
    type: 'string',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'The unique identifier of the ad set',
  })
  public readonly id: string;

  @ApiProperty({
    type: 'string',
    example: 'Ad Set Name',
    description: 'The name of the ad set',
  })
  public readonly name: string;

  @ApiProperty({
    type: 'number',
    example: 1000,
    description: 'The budget of the ad set in cents',
  })
  public readonly budget: number;

  @ApiProperty({
    enum: ['Active', 'Paused', 'Deleted'],
    example: 'Active',
    description: 'The status of the ad set',
  })
  public readonly status: 'Active' | 'Paused' | 'Deleted';

  @ApiProperty({
    type: [Ad],
    description: 'The list of ads under this ad set',
  })
  public readonly ads: Ad[];

  constructor(
    id: string,
    name: string,
    budget: number,
    status: 'Active' | 'Paused' | 'Deleted',
    ads: Ad[],
  ) {
    this.id = id;
    this.name = name;
    this.budget = budget;
    this.status = status;
    this.ads = ads;
  }
}

class Campaign {
  @ApiProperty({
    type: 'string',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'The unique identifier of the campaign',
  })
  public readonly id: string;

  @ApiProperty({
    type: 'string',
    example: 'Campaign Name',
    description: 'The name of the campaign',
  })
  public readonly name: string;

  @ApiProperty({
    type: 'number',
    example: 5000,
    description: 'The budget of the campaign in cents',
  })
  public readonly budget: number;

  @ApiProperty({
    enum: ['Active', 'Paused', 'Deleted'],
    example: 'Active',
    description: 'The status of the campaign',
  })
  public readonly status: 'Active' | 'Paused' | 'Deleted';

  @ApiProperty({
    type: [AdSet],
    description: 'The list of ad sets under this campaign',
  })
  public readonly adSets: AdSet[];

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    example: '2023-10-01T12:00:00Z',
    description: 'The creation timestamp of the campaign',
  })
  public readonly createdAt: string;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    example: '2023-10-01T12:00:00Z',
    description: 'The last updated timestamp of the campaign',
  })
  public readonly updatedAt: string;

  @ApiProperty({
    type: 'number',
    example: 1,
    description: 'The version number of the campaign',
  })
  public readonly version: number;

  constructor(
    id: string,
    name: string,
    budget: number,
    status: 'Active' | 'Paused' | 'Deleted',
    adSets: AdSet[],
  ) {
    this.id = id;
    this.name = name;
    this.budget = budget;
    this.status = status;
    this.adSets = adSets;
  }
}

export class GetAllCampaignsRequest {
  @ApiPropertyOptional({
    type: 'number',
    example: 10,
    description: 'The number of campaigns to retrieve',
    required: false,
    default: 100,
  })
  public readonly take?: number;

  @ApiPropertyOptional({
    type: 'number',
    example: 0,
    description: 'The number of campaigns to skip',
    required: false,
    default: 0,
  })
  public readonly skip?: number;
}

export class GetAllCampaignsResponse {
  @ApiProperty({
    type: [Campaign],
    description: 'The list of campaigns',
  })
  public readonly list: Campaign[];

  @ApiProperty({
    type: 'number',
    example: 1,
    description: 'The total count of campaigns',
  })
  public readonly count: number;

  @ApiProperty({
    type: Object,
    example: { take: 10, skip: 0 },
    description: 'The query parameters used for fetching campaigns',
  })
  public readonly query: GetAllCampaignsRequest;

  constructor(list: Campaign[], count: number, query: GetAllCampaignsRequest) {
    this.list = list;
    this.count = count;
    this.query = query;
  }
}
