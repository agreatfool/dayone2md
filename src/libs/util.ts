import * as LibFs from 'fs';
import { v4 } from 'uuid';
import { DayoneAttachment } from './models';
import { ResMarkdown, ResMarkdownImage } from './result';

export const padNumLeft0 = (num: number, length: number): string => {
  // (5, 4) => '0005'
  let str = String(num);
  const gap = length - str.length;
  if (gap > 0) {
    str = new Array(gap + 1).join('0') + str;
  }

  return str;
};

export const genTagStr = (tagName: string): string => {
  return `#${tagName}`;
};

export const genTagYear = (year: number): string => {
  return genTagStr(`Y${year}`);
};

export const genTagMonth = (year: number, month: number): string[] => {
  const monthStr = padNumLeft0(month, 2);
  return [genTagStr(`M${year}${monthStr}`), genTagStr(`M${monthStr}`)];
};

export const genTagDay = (year: number, month: number, day: number): string[] => {
  const monthStr = padNumLeft0(month, 2);
  const dayStr = padNumLeft0(day, 2);
  return [genTagStr(`D${year}${monthStr}${dayStr}`), genTagStr(`D${monthStr}${dayStr}`)];
};

export const genDateStr = (year: number, month: number, day: number): string => {
  return `${year}-${padNumLeft0(month, 2)}-${padNumLeft0(day, 2)}`;
};

export const genPostDirStr = (year: number, month: number, day: number, slug: string): string => {
  const monthStr = padNumLeft0(month, 2);
  const dayStr = padNumLeft0(day, 2);

  return `/${year}/${monthStr}/${year + monthStr + dayStr}-${slug}`;
};

export const uuidv4 = (): string => {
  return v4().replace(/-/g, '').toUpperCase();
};

export const loadPostTitleSlugMappingJson = (path: string): Map<string, string> => {
  const mapping = new Map<string, string>();
  if (path && LibFs.existsSync(path) && LibFs.statSync(path).isFile()) {
    const content = LibFs.readFileSync(path).toString();
    try {
      const pairs = JSON.parse(content);
      for (const [title, slug] of Object.entries(pairs)) {
        mapping.set(title, slug as string);
      }
    } catch (err) {
      console.log('Wrong mapping file content, non-json, skip it ...', err);
    }
  }

  return mapping;
};

export const isStringDayoneImage = (row: string): string | null => {
  /**
   * ![](dayone-moment://9A2D00938E4C4967920ED8C83C3060AB)
   * =>
   * [
   *   '![](dayone-moment://9A2D00938E4C4967920ED8C83C3060AB)',
   *   '9A2D00938E4C4967920ED8C83C3060AB',
   *   index: 0,
   *   input: '![](dayone-moment://9A2D00938E4C4967920ED8C83C3060AB)',
   *   groups: undefined
   * ]
   */
  const pattern = /!\[\]\(dayone-moment:\/\/([A-Z0-9]{32})\)/;
  const result = row.match(pattern);

  if (result) {
    return result[1];
  }
  return null;
};

export const isStringDayonePost = (row: string): string | null => {
  /**
   * [Some post title 2019年1月8日 下午7:12](dayone2://view?entryId=CC08EAA4F4B144EBBA74E416DCDB0B66)
   * =>
   * [
   *   '[Some post title 2019年1月8日 下午7:12](dayone2://view?entryId=CC08EAA4F4B144EBBA74E416DCDB0B66)',
   *   'CC08EAA4F4B144EBBA74E416DCDB0B66',
   *   index: 0,
   *   input: '[Some post title 2019年1月8日 下午7:12](dayone2://view?entryId=CC08EAA4F4B144EBBA74E416DCDB0B66)',
   *   groups: undefined
   * ]
   */
  const pattern = /\[.*\]\(dayone2:\/\/view\?entryId=([A-Z0-9]{32})\)/;
  const result = row.match(pattern);

  if (result) {
    return result[1];
  }
  return null;
};

export const trimDayoneRow = (row: string): string => {
  return row.trim().replace(/\\/g, '');
};

export const removeDayoneRowTitleMark = (row: string): string => {
  /**
   * #h1-title | ## h2-title | ...
   * =>
   * h1-title | h2-title | ...
   */
  return row.replace(/^#+/, '').trim();
};

export const removeIndexFromArr = <T = unknown>(arr: Array<T>, index: number): void => {
  if (index > -1) {
    arr.splice(index, 1);
  }
};

export const isStringContainsCn = (str: string): boolean => {
  return /[\u3400-\u9FBF]/.test(str);
};

export const convertDayoneAttachment2ResMarkdownImage = (attachment: DayoneAttachment, postUuid: string, markdown: ResMarkdown): ResMarkdownImage => {
  const counter = markdown.imageCounter;
  const imageFileName = `${attachment.filename}.${attachment.filetype}`;

  const res = {
    indexInEntry: counter,
    dayoneFileName: imageFileName,
    newFileName: `${postUuid}_${padNumLeft0(counter, 4)}.${attachment.filetype}`,
    attachment
  } as ResMarkdownImage;

  markdown.imageCounter++;

  return res;
};
