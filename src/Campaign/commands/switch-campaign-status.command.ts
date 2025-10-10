export class SwitchCampaignStatusCommand {
  constructor(
    public readonly id: string,
    public readonly status: 'Paused' | 'Active',
    public readonly version: number,
  ) {}
}
