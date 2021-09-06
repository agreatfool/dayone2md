export class Processor {
  private _dest: string;

  constructor(dest: string) {
    this._dest = dest;
  }

  public async process(): Promise<void> {
    console.log('process');
  }
}
