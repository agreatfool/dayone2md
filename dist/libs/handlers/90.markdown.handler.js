"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const handler_1 = require("../handler");
const db_1 = require("../db");
const util_1 = require("../util");
const processor_1 = require("../processor");
class MarkdownHandler extends handler_1.Handler {
    execute(entryId, result) {
        return __awaiter(this, void 0, void 0, function* () {
            // get post detail
            const entry = yield db_1.DB.get().entryDetailById(entryId);
            // init some class attributes
            this._rows = this._splitMdRows(entry.markdown);
            this._result = result;
            this._mapping = processor_1.Processor.get().getMapping();
            this._markdown = result.markdown; // pointer
            this._postUuid = result.frontmatter.uuid;
            // execute the markdown parsing
            // title
            const title = this._fetchTitle();
            this._result.frontmatter.title = title;
            // slug
            this._result.frontmatter.slug = this._genSlugFromTitle(title);
            // all others
            yield this._loopAllMarkdownRows();
        });
    }
    _splitMdRows(markdown) {
        return markdown.split(/\r\n|\r|\n/).map((row) => util_1.trimDayoneRow(row));
    }
    _fetchTitle() {
        for (const [index, row] of this._rows.entries()) {
            if (util_1.isStringDayoneImage(row) !== null || util_1.isStringDayonePost(row) !== null) {
                // row is: cover string || post string
                continue;
            }
            if (row === '') {
                // empty row
                continue;
            }
            const title = util_1.removeDayoneRowTitleMark(row);
            this._rows[index] = `# ${title}`;
            return title;
        }
    }
    _genSlugFromTitle(title) {
        const connectWithDash = function (str) {
            return str.replace(/\s+/g, '-');
        };
        if (!util_1.isStringContainsCn(title)) {
            return connectWithDash(title.toLowerCase());
        }
        if (this._mapping.has(title)) {
            return this._mapping.get(title);
        }
        console.log(`UNEXPECTED: No slug mapping found for title: ${title}`);
        return connectWithDash(title.toLowerCase());
    }
    _saveMarkdownParagraph(type, content) {
        this._markdown.paragraphs.push({
            type,
            content
        });
    }
    _loopAllMarkdownRows() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const row of this._rows) {
                yield this._handleMarkdownRow(row);
            }
            this._handleGalleryPost();
            this._handleSingleImageGallery();
        });
    }
    _handleGalleryPost() {
        // if the content of a post are all images (maybe some empty rows in the middle),
        // the cover phase won't end, since there is no non-cover content in the post
        // for such case, need to convert all images from type "cover" to type "gallery"
        if (this._markdown.isCoverPhaseDone) {
            // means cover phase normally ends, no need to handle
            return;
        }
        const gallery = [];
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
            gallery.push(content);
        }
        if (gallery.length > 0 && !hasWrongType) {
            // do not overwrite paragraphs if wrong type case
            this._markdown.paragraphs = [
                {
                    type: 'gallery',
                    content: gallery
                }
            ];
        }
    }
    _handleSingleImageGallery() {
        for (const [index, paragraph] of this._markdown.paragraphs.entries()) {
            if (paragraph.type !== 'gallery') {
                continue;
            }
            const content = paragraph.content;
            if (content.length === 1) {
                this._markdown.paragraphs[index] = {
                    type: 'image',
                    content: content[0]
                };
            }
        }
    }
    _handleMarkdownRow(row) {
        return __awaiter(this, void 0, void 0, function* () {
            // empty row case
            if (row === '') {
                if (!this._markdown.isInGalleryPhase) {
                    this._saveMarkdownParagraph('paragraph', '');
                }
                return;
            }
            if (!this._markdown.isCoverPhaseDone) {
                // cover phase not done, still cover phase
                yield this._handleCoverPhaseRow(row);
            }
            else {
                // cover phase done, normal phase
                yield this._handleNormalPhaseRow(row);
            }
        });
    }
    _handleCoverPhaseRow(row) {
        return __awaiter(this, void 0, void 0, function* () {
            // ResMarkdown initialized with "isCoverPhaseDone = false"
            // handle rows one by one from the very beginning
            // if encountered any row that is not image (nor empty row), then mark "isCoverPhaseDone = true", and handle it as normal row
            const imageUuid = util_1.isStringDayoneImage(row);
            if (imageUuid === null) {
                // means found some non cover image row (nor empty row)
                // mark cover phase done, and handle current row as normal phase row
                this._markdown.isCoverPhaseDone = true;
                yield this._handleNormalPhaseRow(row);
            }
            else {
                // cover image row
                const attachment = yield db_1.DB.get().attachmentDetail(imageUuid);
                this._saveMarkdownParagraph('cover', util_1.convertDayoneAttachment2ResMarkdownImage(attachment, this._postUuid, this._markdown));
            }
        });
    }
    _handleNormalPhaseRow(row) {
        return __awaiter(this, void 0, void 0, function* () {
            const imageUuid = util_1.isStringDayoneImage(row);
            const postUuid = util_1.isStringDayonePost(row);
            if (imageUuid !== null) {
                yield this._handleGalleryRow(imageUuid);
            }
            else if (postUuid !== null) {
                this._handlePostRow(postUuid);
            }
            else {
                this._handleNormalRow(row);
            }
        });
    }
    _handleNormalRow(row) {
        if (this._markdown.isInGalleryPhase) {
            // gallery terminated
            this._markdown.isInGalleryPhase = false;
        }
        this._saveMarkdownParagraph('paragraph', row);
    }
    _handlePostRow(postUuid) {
        if (this._markdown.isInGalleryPhase) {
            // gallery terminated
            this._markdown.isInGalleryPhase = false;
        }
        this._saveMarkdownParagraph('post', { postUuid });
    }
    _handleGalleryRow(imageUuid) {
        return __awaiter(this, void 0, void 0, function* () {
            const markdown = this._markdown; // pointer
            const attachment = yield db_1.DB.get().attachmentDetail(imageUuid);
            if (!markdown.isInGalleryPhase) {
                // means this is the first image line of the upcoming gallery
                // set the status flag to true, and make a gallery node in the paragraphs list
                markdown.isInGalleryPhase = true;
                this._saveMarkdownParagraph('gallery', []);
            }
            let galleryNode;
            for (let i = markdown.paragraphs.length - 1; i > 0; i--) {
                if (markdown.paragraphs[i].type === 'gallery') {
                    galleryNode = markdown.paragraphs[i];
                    break;
                }
            }
            galleryNode.content.push(util_1.convertDayoneAttachment2ResMarkdownImage(attachment, this._postUuid, this._markdown));
        });
    }
}
exports.default = MarkdownHandler;
//# sourceMappingURL=90.markdown.handler.js.map