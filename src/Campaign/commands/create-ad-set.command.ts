import type { ICommand } from '@nestjs/cqrs';

export class CreateAdSetCommand implements ICommand {
  constructor(
    public readonly campaignId: string,
    public readonly name: string,
    public readonly budget: number,
    public readonly version: number,
  ) {}
}
