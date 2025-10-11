import type { ICommand } from '@nestjs/cqrs';

export class SwitchAdSetStatusCommand implements ICommand {
  constructor(
    public readonly campaignId: string,
    public readonly adSetId: string,
    public readonly status: 'Active' | 'Paused',
    public readonly version: number,
  ) {}
}
