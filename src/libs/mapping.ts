import * as LibFs from 'fs/promises';
import * as LibPath from 'path';
import { DB } from './db';
import MarkdownHandler from './handlers/90.markdown.handler';
import { isStringContainsCn } from './util';

export class MappingConfigGenerator extends MarkdownHandler {
  private readonly _dest: string;

  constructor(dest: string) {
    super();
    this._dest = dest;
  }

  public async process(): Promise<void> {
    const config = {} as { [title: string]: string };
    const ids = await DB.get().entryAllIds();

    for (const idRecord of ids) {
      const entryId = idRecord.id;
      const entry = await DB.get().entryDetailById(entryId);
      this._rows = this._splitMdRows(entry.markdown);
      const title = this._fetchTitle();

      if (isStringContainsCn(title)) {
        config[title] = '';
      }
    }

    await LibFs.writeFile(LibPath.join(this._dest, 'mapping.json'), JSON.stringify(config, null, 2));
  }
}
