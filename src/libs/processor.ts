import * as LibFs from 'fs';
import * as LibPath from 'path';
import { DB } from './db';
import { Handler } from './handler';
import { ResData } from './result';
import { Generator } from './generator';

export class Processor {
  private static _instance: Processor;
  public static get(dest?: string, mapping?: Map<string, string>): Processor {
    if (!Processor._instance) {
      if (!dest || !mapping) {
        throw new Error('Processor instance not found, in this case params are required');
      }
      Processor._instance = new Processor(dest, mapping);
    }
    return Processor._instance;
  }

  private readonly _dest: string;
  private readonly _mapping: Map<string, string>; // { title: slug, ... }
  private readonly _handlers: Handler[];

  constructor(dest: string, mapping: Map<string, string>) {
    this._dest = dest;
    this._mapping = mapping;
    this._handlers = [];
  }

  public getDest(): string {
    return this._dest;
  }

  public getMapping(): Map<string, string> {
    return this._mapping;
  }

  public async process(): Promise<void> {
    console.log('Start to process ...');

    // load handlers
    await this._loadHandlers();

    const ids = await DB.get().entryAllIds();
    const total = ids.length;
    for (const [index, idRecord] of ids.entries()) {
      console.log(`Start to process entry: ${idRecord.id} , ${index} / ${total} ...`);
      await this._processSingleEntry(idRecord.id);
    }
  }

  private async _loadHandlers(): Promise<void> {
    const handlersPath = LibPath.join(__dirname, 'handlers');
    const handlerFileNames = await LibFs.promises.readdir(handlersPath);
    for (const handlerFileName of handlerFileNames) {
      if (handlerFileName.endsWith('.map')) {
        continue; // ignore map file
      }
      const fullPath = LibPath.join(handlersPath, handlerFileName);
      const handlerModule = require(fullPath); // { default: SomeHandlerClass }
      this._handlers.push(new handlerModule.default());
    }
  }

  private async _processSingleEntry(entryId: number): Promise<void> {
    const result = new ResData();
    for (const handlerInstance of this._handlers) {
      await handlerInstance.execute(entryId, result);
    }
    await new Generator().execute(result);
  }
}
