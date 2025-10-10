export class AdjustCampaignBudgetCommand {
  constructor(
    public readonly id: string,
    public readonly adjustAmount: number,
    public readonly version: number,
  ) {}
}
