import { Handler } from '../handler';
import { ResData } from '../result';
import { DB } from '../db';
import { genTagDay, genTagMonth, genTagStr, genTagYear } from '../util';

export default class TagHandler extends Handler {
  public async execute(entryId: number, result: ResData): Promise<void> {
    const entry = await DB.get().entryDetailById(entryId);
    result.tags.push(genTagYear(entry.year));
    result.tags.push(...genTagMonth(entry.year, entry.month));
    result.tags.push(...genTagDay(entry.year, entry.month, entry.day));

    const tags = await DB.get().entryTagIds(entryId);
    if (tags.length <= 0) {
      // no tags in this entry, skip
      return;
    }

    for (const tag of tags) {
      const tagDetail = await DB.get().tagDetail(tag.tagId);
      result.tags.push(genTagStr(tagDetail.name));
    }
  }
}
