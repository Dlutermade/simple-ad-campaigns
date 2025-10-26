import type { ICommand } from '@nestjs/cqrs';

export class CreateAdCommand implements ICommand {
  constructor(
    public readonly campaignId: string,
    public readonly adSetId: string,
    public readonly name: string,
    public readonly content: string,
    public readonly creative: string,
    public readonly version: number,
  ) {}
}
