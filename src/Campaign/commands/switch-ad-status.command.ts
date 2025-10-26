import type { ICommand } from '@nestjs/cqrs';

export class SwitchAdStatusCommand implements ICommand {
  constructor(
    public readonly campaignId: string,
    public readonly adSetId: string,
    public readonly adId: string,
    public readonly status: 'Active' | 'Paused',
    public readonly version: number,
  ) {}
}
