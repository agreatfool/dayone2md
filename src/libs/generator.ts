import * as LibFs from 'fs/promises';
import * as LibPath from 'path';
import { ResData, ResMarkdownImage, ResMarkdownOuterPost } from './result';
import { Processor } from './processor';
import { DAYONE_PHOTO_PATH, POST_ASSETS_DIR_NAME } from './const';
import { padNumLeft0 } from './util';
import { DB } from './db';
import MarkdownHandler from './handlers/90.markdown.handler';

const mkdirp = require('mkdirp');

export class Generator {
  private _result: ResData;
  private _dest: string; // path to the vault: /Users/Jonathan/vault/base/Notes
  private _vaultName: string; // Notes
  private _postDir: string; // absolute path: /Users/Jonathan/vault/base/Notes/2020/09/20200911-test-slug
  private _postAssetsDir: string; // absolute path: /Users/Jonathan/vault/base/Notes/2020/09/20200911-test-slug/assets
  private _frontmatter: string;
  private _markdown: string;
  private _tags: string;

  constructor() {
    this._dest = '';
    this._vaultName = '';
    this._postDir = '';
    this._postAssetsDir = '';
    this._frontmatter = '';
    this._markdown = '';
    this._tags = '';
  }

  public async execute(result: ResData): Promise<void> {
    this._result = result;
    this._dest = Processor.get().getDest();
    this._vaultName = this._genVaultName();
    await this._genPostDir();
    this._frontmatter = this._genFrontmatter();
    this._markdown = await this._genOutputMarkdown();
    this._tags = await this._genTagsStr();
    await this._genMarkdownFile();
  }

  private _genVaultName(): string {
    return LibPath.parse(this._dest).name;
  }

  private async _genPostDir(): Promise<void> {
    let hasAssets = false;
    for (const paragraph of this._result.markdown.paragraphs) {
      if (['cover', 'image', 'gallery'].includes(paragraph.type)) {
        hasAssets = true;
      }
    }

    this._postDir = LibPath.join(this._dest, this._result.frontmatter.path);
    await mkdirp(this._postDir);

    if (hasAssets) {
      this._postAssetsDir = LibPath.join(this._postDir, POST_ASSETS_DIR_NAME);
      await mkdirp(this._postAssetsDir);
    }
  }

  private _genFrontmatter(): string {
    const fm = this._result.frontmatter;
    return [
      '---',
      `uuid: "${fm.uuid}"`,
      `path: "${fm.path}"`,
      `date: "${fm.date}"`,
      `slug: "${fm.slug}"`,
      `title: "${fm.title}"`,
      `location:`,
      `  altitude: ${fm.location.altitude}`,
      `  latitude: ${fm.location.latitude}`,
      `  longitude: ${fm.location.longitude}`,
      `  address: ${fm.location.address ? '"' + fm.location.address + '"' : null}`,
      `  placename: ${fm.location.placename ? '"' + fm.location.placename + '"' : null}`,
      `  district: ${fm.location.district ? '"' + fm.location.district + '"' : null}`,
      `  city: ${fm.location.city ? '"' + fm.location.city + '"' : null}`,
      `  province: ${fm.location.province ? '"' + fm.location.province + '"' : null}`,
      `  country: ${fm.location.country ? '"' + fm.location.country + '"' : null}`,
      `weather:`,
      `  temperature: ${fm.weather.temperature}`,
      `  humidity: ${fm.weather.humidity}`,
      `  weather: ${fm.weather.weather ? '"' + fm.weather.weather + '"' : null}`,
      `  time: ${fm.weather.time ? '"' + fm.weather.time + '"' : null}`,
      `  aqi: ${fm.weather.aqi}`,
      '---',
      ''
    ].join('\n');
  }

  private async _genOutputMarkdown(): Promise<string> {
    const markdown: string[] = [];

    let galleryIndex = 0;
    for (const paragraph of this._result.markdown.paragraphs) {
      switch (paragraph.type) {
        case 'cover':
        case 'image':
          markdown.push(await this._genOutputMdImage(paragraph.content as ResMarkdownImage));
          break;
        case 'gallery':
          markdown.push(...(await this._genOutputMdGallery(paragraph.content as ResMarkdownImage[], galleryIndex)));
          galleryIndex++;
          break;
        case 'post':
          markdown.push(await this._genOutputMdPost((paragraph.content as ResMarkdownOuterPost).postUuid));
          break;
        case 'paragraph':
          markdown.push(paragraph.content as string);
          break;
        default:
          throw new Error('Invalid paragraph.type');
      }
    }

    return markdown.join('\n');
  }

  private _genTagsStr(): string {
    return this._result.tags.join(' ');
  }

  private async _genOutputMdImage(image: ResMarkdownImage): Promise<string> {
    const source = LibPath.join(DAYONE_PHOTO_PATH, image.dayoneFileName);
    const dest = LibPath.join(this._postAssetsDir, image.newFileName);
    await this._copyFile(source, dest);

    return `![[${image.newFileName}]]`;
  }

  private async _genOutputMdGallery(images: ResMarkdownImage[], galleryIndex: number): Promise<string[]> {
    const galleryName = this._genGalleryDirName(galleryIndex);
    const galleryDir = LibPath.join(this._postAssetsDir, galleryName);
    await mkdirp(galleryDir);

    for (const image of images) {
      const source = LibPath.join(DAYONE_PHOTO_PATH, image.dayoneFileName);
      const dest = LibPath.join(galleryDir, image.newFileName);
      await this._copyFile(source, dest);
    }

    return [
      '```gallery',
      'type=grid',
      `path=${LibPath.join(this._vaultName, this._result.frontmatter.path, POST_ASSETS_DIR_NAME, galleryName)}`,
      'imgWidth=250',
      'divWidth=100',
      'divAlign=left',
      'reverseOrder=false',
      '```'
    ];
  }

  private async _genOutputMdPost(postUuid: string): Promise<string> {
    const result = new ResData();
    const mdHandler = new MarkdownHandler();
    const entry = await DB.get().entryDetailByUuid(postUuid);
    await mdHandler.execute(entry.id, result);

    return `[${result.frontmatter.title}](${result.frontmatter.slug}.md)`;
  }

  private _genGalleryDirName(galleryIndex: number): string {
    return `gallery${padNumLeft0(galleryIndex, 2)}`;
  }

  private async _copyFile(source: string, dest: string): Promise<void> {
    // stub for unit test
    return LibFs.copyFile(source, dest);
  }

  private async _genMarkdownFile(): Promise<void> {
    const filePath = LibPath.join(this._postDir, this._result.frontmatter.slug + '.md');
    await LibFs.writeFile(filePath, this._frontmatter + '\n' + this._markdown + '\n\n' + this._tags);
  }
}
