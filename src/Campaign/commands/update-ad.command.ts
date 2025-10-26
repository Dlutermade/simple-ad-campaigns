import type { ICommand } from '@nestjs/cqrs';

export class UpdateAdCommand implements ICommand {
  constructor(
    public readonly campaignId: string,
    public readonly adSetId: string,
    public readonly adId: string,
    public readonly name: string,
    public readonly content: string,
    public readonly creative: string,
    public readonly version: number,
  ) {}
}
