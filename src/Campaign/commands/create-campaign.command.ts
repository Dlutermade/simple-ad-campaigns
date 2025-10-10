import type { ICommand } from '@nestjs/cqrs';

export class CreateCampaignCommand implements ICommand {
  constructor(
    public readonly name: string,
    public readonly budget: number,
  ) {}
}
