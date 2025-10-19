export class DeleteAdSetCommand {
  constructor(
    public readonly campaignId: string,
    public readonly adSetId: string,
    public readonly version: number,
  ) {}
}
