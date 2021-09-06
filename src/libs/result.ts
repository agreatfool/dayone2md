import { uuidv4 } from './util';
import { DayoneAttachment } from './models';

export class ResWeather {
  public temperature: number = null;
  public humidity: number = null;
  public weather: string = null;
  public time: string = null;
  public aqi: number = null;
}

export class ResLocation {
  public altitude: number = null;
  public latitude: number = null;
  public longitude: number = null;
  public address: string = null;
  public placename: string = null;
  public district: string = null;
  public city: string = null;
  public province: string = null;
  public country: string = null;
}

export class ResFrontmatter {
  public uuid: string = uuidv4();
  public path = '';
  public date = '';
  public slug = '';
  public title = '';
  public location = new ResLocation();
  public weather = new ResWeather();
}

export class ResMarkdown {
  public imageCounter = 0; // +1 once an image added into paragraphs
  public isCoverPhaseDone = false;
  public isInGalleryPhase = false;
  public paragraphs: ResMarkdownParagraph[] = [];
}

export type ResMarkdownParagraphType = 'cover' | 'paragraph' | 'post' | 'image' | 'gallery';
export type ResMarkdownParagraphContent = ResMarkdownImage | string | ResMarkdownOuterPost | ResMarkdownImage[]; // cover/image | paragraph | post | gallery

export interface ResMarkdownParagraph {
  type: ResMarkdownParagraphType;
  content: ResMarkdownParagraphContent;
}

export interface ResMarkdownImage {
  indexInEntry: number; // from 0 to ?, number, index of the image in the entry
  dayoneFileName: string; // old file name in the dayone photos folder
  newFileName: string; // new file name in the obsidian assets folder
  attachment: DayoneAttachment;
}

export interface ResMarkdownOuterPost {
  postUuid: string;
}

export class ResData {
  public location = new ResLocation();
  public weather = new ResWeather();
  public tags: string[] = [];
  public frontmatter = new ResFrontmatter();
  public markdown = new ResMarkdown();
}
