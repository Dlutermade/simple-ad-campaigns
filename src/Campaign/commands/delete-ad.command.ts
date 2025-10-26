import type { ICommand } from '@nestjs/cqrs';

export class DeleteAdCommand implements ICommand {
  constructor(
    public readonly campaignId: string,
    public readonly adSetId: string,
    public readonly adId: string,
    public readonly version: number,
  ) {}
}
