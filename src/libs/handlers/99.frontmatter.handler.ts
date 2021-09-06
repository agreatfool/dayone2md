import { Handler } from '../handler';
import { ResData } from '../result';
import { DB } from '../db';
import { genDateStr, genPostDirStr } from '../util';

export default class FrontmatterHandler extends Handler {
  public async execute(entryId: number, result: ResData): Promise<void> {
    // title & slug would be filled already in markdown handler, since they are all parsed from markdown text
    const entry = await DB.get().entryDetailById(entryId);

    result.frontmatter.path = genPostDirStr(entry.year, entry.month, entry.day, result.frontmatter.slug);
    result.frontmatter.date = genDateStr(entry.year, entry.month, entry.day);
    result.frontmatter.location = result.location;
    result.frontmatter.weather = result.weather;
  }
}
