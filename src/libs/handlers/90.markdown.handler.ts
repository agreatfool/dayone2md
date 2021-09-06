import { Handler } from '../handler';
import { ResData, ResMarkdown, ResMarkdownImage, ResMarkdownParagraph, ResMarkdownParagraphContent, ResMarkdownParagraphType } from '../result';
import { DB } from '../db';
import {
  convertDayoneAttachment2ResMarkdownImage,
  isStringContainsCn,
  isStringDayoneImage,
  isStringDayonePost,
  removeDayoneRowTitleMark,
  trimDayoneRow
} from '../util';
import { Processor } from '../processor';

export default class MarkdownHandler extends Handler {
  protected _rows: string[];
  private _result: ResData;
  private _mapping: Map<string, string>;
  private _markdown: ResMarkdown;
  private _postUuid: string;

  public async execute(entryId: number, result: ResData): Promise<void> {
    // get post detail
    const entry = await DB.get().entryDetailById(entryId);

    // init some class attributes
    this._rows = this._splitMdRows(entry.markdown);
    this._result = result;
    this._mapping = Processor.get().getMapping();
    this._markdown = result.markdown; // pointer
    this._postUuid = result.frontmatter.uuid;

    // execute the markdown parsing
    // title
    const title = this._fetchTitle();
    this._result.frontmatter.title = title;
    // slug
    this._result.frontmatter.slug = this._genSlugFromTitle(title);
    // all others
    await this._loopAllMarkdownRows();
  }

  protected _splitMdRows(markdown: string): string[] {
    return markdown.split(/\r\n|\r|\n/).map((row) => trimDayoneRow(row));
  }

  protected _fetchTitle(): string {
    for (const [index, row] of this._rows.entries()) {
      if (isStringDayoneImage(row) !== null || isStringDayonePost(row) !== null) {
        // row is: cover string || post string
        continue;
      }
      if (row === '') {
        // empty row
        continue;
      }

      const title = removeDayoneRowTitleMark(row);
      this._rows[index] = `# ${title}`;
      return title;
    }
  }

  private _genSlugFromTitle(title: string): string {
    const connectWithDash = function (str: string): string {
      return str.replace(/\s+/g, '-');
    };
    if (!isStringContainsCn(title)) {
      return connectWithDash(title.toLowerCase());
    }
    if (this._mapping.has(title)) {
      return this._mapping.get(title);
    }
    console.log(`UNEXPECTED: No slug mapping found for title: ${title}`);
    return connectWithDash(title.toLowerCase());
  }

  private _saveMarkdownParagraph(type: ResMarkdownParagraphType, content: ResMarkdownParagraphContent): void {
    this._markdown.paragraphs.push({
      type,
      content
    } as ResMarkdownParagraph);
  }

  private async _loopAllMarkdownRows(): Promise<void> {
    for (const row of this._rows) {
      await this._handleMarkdownRow(row);
    }
    this._handleGalleryPost();
    this._handleSingleImageGallery();
  }

  private _handleGalleryPost(): void {
    // if the content of a post are all images (maybe some empty rows in the middle),
    // the cover phase won't end, since there is no non-cover content in the post
    // for such case, need to convert all images from type "cover" to type "gallery"
    if (this._markdown.isCoverPhaseDone) {
      // means cover phase normally ends, no need to handle
      return;
    }

    const gallery: ResMarkdownImage[] = [];

    let hasWrongType = false;
    for (const paragraph of this._markdown.paragraphs) {
      const type = paragraph.type;
      const content = paragraph.content;
      if (type !== 'cover' && !(type === 'paragraph' && content === '')) {
        console.log(`Post [${this._postUuid}] cover phase not end, but contains some paragraph not cover type!`, this._markdown.paragraphs);
        hasWrongType = true;
        continue;
      }
      if (type === 'paragraph' && content === '') {
        // though this is a valid case, no need to collect it
        continue;
      }
      gallery.push(content as ResMarkdownImage);
    }

    if (gallery.length > 0 && !hasWrongType) {
      // do not overwrite paragraphs if wrong type case
      this._markdown.paragraphs = [
        {
          type: 'gallery',
          content: gallery
        } as ResMarkdownParagraph
      ];
    }
  }

  private _handleSingleImageGallery(): void {
    for (const [index, paragraph] of this._markdown.paragraphs.entries()) {
      if (paragraph.type !== 'gallery') {
        continue;
      }

      const content = paragraph.content as ResMarkdownImage[];
      if (content.length === 1) {
        this._markdown.paragraphs[index] = {
          type: 'image',
          content: content[0]
        };
      }
    }
  }

  private async _handleMarkdownRow(row: string): Promise<void> {
    // empty row case
    if (row === '') {
      if (!this._markdown.isInGalleryPhase) {
        this._saveMarkdownParagraph('paragraph', '');
      }
      return;
    }

    if (!this._markdown.isCoverPhaseDone) {
      // cover phase not done, still cover phase
      await this._handleCoverPhaseRow(row);
    } else {
      // cover phase done, normal phase
      await this._handleNormalPhaseRow(row);
    }
  }

  private async _handleCoverPhaseRow(row: string): Promise<void> {
    // ResMarkdown initialized with "isCoverPhaseDone = false"
    // handle rows one by one from the very beginning
    // if encountered any row that is not image (nor empty row), then mark "isCoverPhaseDone = true", and handle it as normal row
    const imageUuid = isStringDayoneImage(row);
    if (imageUuid === null) {
      // means found some non cover image row (nor empty row)
      // mark cover phase done, and handle current row as normal phase row
      this._markdown.isCoverPhaseDone = true;
      await this._handleNormalPhaseRow(row);
    } else {
      // cover image row
      const attachment = await DB.get().attachmentDetail(imageUuid);
      this._saveMarkdownParagraph('cover', convertDayoneAttachment2ResMarkdownImage(attachment, this._postUuid, this._markdown));
    }
  }

  private async _handleNormalPhaseRow(row: string): Promise<void> {
    const imageUuid = isStringDayoneImage(row);
    const postUuid = isStringDayonePost(row);

    if (imageUuid !== null) {
      await this._handleGalleryRow(imageUuid);
    } else if (postUuid !== null) {
      this._handlePostRow(postUuid);
    } else {
      this._handleNormalRow(row);
    }
  }

  private _handleNormalRow(row: string): void {
    if (this._markdown.isInGalleryPhase) {
      // gallery terminated
      this._markdown.isInGalleryPhase = false;
    }

    this._saveMarkdownParagraph('paragraph', row);
  }

  private _handlePostRow(postUuid: string): void {
    if (this._markdown.isInGalleryPhase) {
      // gallery terminated
      this._markdown.isInGalleryPhase = false;
    }

    this._saveMarkdownParagraph('post', { postUuid });
  }

  private async _handleGalleryRow(imageUuid: string): Promise<void> {
    const markdown = this._markdown; // pointer
    const attachment = await DB.get().attachmentDetail(imageUuid);

    if (!markdown.isInGalleryPhase) {
      // means this is the first image line of the upcoming gallery
      // set the status flag to true, and make a gallery node in the paragraphs list
      markdown.isInGalleryPhase = true;
      this._saveMarkdownParagraph('gallery', [] as ResMarkdownImage[]);
    }

    let galleryNode: ResMarkdownParagraph;
    for (let i = markdown.paragraphs.length - 1; i > 0; i--) {
      if (markdown.paragraphs[i].type === 'gallery') {
        galleryNode = markdown.paragraphs[i];
        break;
      }
    }
    (galleryNode.content as ResMarkdownImage[]).push(convertDayoneAttachment2ResMarkdownImage(attachment, this._postUuid, this._markdown));
  }
}
