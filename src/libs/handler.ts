import { ResData } from './result';

export abstract class Handler {
  public abstract execute(entryId: number, result: ResData): Promise<void>;
}
