import type { IQuery } from '@nestjs/cqrs';

export class FindCampaignByIdQuery implements IQuery {
  constructor(public readonly id: string) {}
}
