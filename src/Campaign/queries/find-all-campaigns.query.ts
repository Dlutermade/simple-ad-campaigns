import type { IQuery } from '@nestjs/cqrs';

export class FindAllCampaignsQuery implements IQuery {
  constructor(
    public readonly take: number = 100,
    public readonly skip: number = 0,
  ) {}
}
