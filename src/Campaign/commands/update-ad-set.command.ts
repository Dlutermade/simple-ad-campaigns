import type { ICommand } from '@nestjs/cqrs';

export class UpdateAdSetCommand implements ICommand {
  constructor(
    public readonly campaignId: string,
    public readonly adSetId: string,
    public readonly name: string,
    public readonly version: number,
  ) {}
}
