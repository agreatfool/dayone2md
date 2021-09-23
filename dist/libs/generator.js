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
exports.Generator = void 0;
const LibFs = require("fs/promises");
const LibPath = require("path");
const result_1 = require("./result");
const processor_1 = require("./processor");
const const_1 = require("./const");
const util_1 = require("./util");
const db_1 = require("./db");
const _90_markdown_handler_1 = require("./handlers/90.markdown.handler");
const mkdirp = require('mkdirp');
class Generator {
    constructor() {
        this._dest = '';
        this._vaultName = '';
        this._postDir = '';
        this._postAssetsDir = '';
        this._frontmatter = '';
        this._markdown = '';
        this._tags = '';
    }
    execute(result) {
        return __awaiter(this, void 0, void 0, function* () {
            this._result = result;
            this._dest = processor_1.Processor.get().getDest();
            this._vaultName = this._genVaultName();
            yield this._genPostDir();
            this._frontmatter = this._genFrontmatter();
            this._markdown = yield this._genOutputMarkdown();
            this._tags = yield this._genTagsStr();
            yield this._genMarkdownFile();
        });
    }
    _genVaultName() {
        return LibPath.parse(this._dest).name;
    }
    _genPostDir() {
        return __awaiter(this, void 0, void 0, function* () {
            let hasAssets = false;
            for (const paragraph of this._result.markdown.paragraphs) {
                if (['cover', 'image', 'gallery'].includes(paragraph.type)) {
                    hasAssets = true;
                }
            }
            this._postDir = LibPath.join(this._dest, this._result.frontmatter.path);
            yield mkdirp(this._postDir);
            if (hasAssets) {
                this._postAssetsDir = LibPath.join(this._postDir, const_1.POST_ASSETS_DIR_NAME);
                yield mkdirp(this._postAssetsDir);
            }
        });
    }
    _genFrontmatter() {
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
            `  address: "${fm.location.address}"`,
            `  placename: "${fm.location.placename}"`,
            `  district: "${fm.location.district}"`,
            `  city: "${fm.location.city}"`,
            `  province: "${fm.location.province}"`,
            `  country: "${fm.location.country}"`,
            `weather:`,
            `  temperature: ${fm.weather.temperature}`,
            `  humidity: ${fm.weather.humidity}`,
            `  weather: "${fm.weather.weather}"`,
            `  time: "${fm.weather.time}"`,
            `  aqi: ${fm.weather.aqi}`,
            '---',
            ''
        ].join('\n');
    }
    _genOutputMarkdown() {
        return __awaiter(this, void 0, void 0, function* () {
            const markdown = [];
            let galleryIndex = 0;
            for (const paragraph of this._result.markdown.paragraphs) {
                switch (paragraph.type) {
                    case 'cover':
                    case 'image':
                        markdown.push(yield this._genOutputMdImage(paragraph.content));
                        break;
                    case 'gallery':
                        markdown.push(...(yield this._genOutputMdGallery(paragraph.content, galleryIndex)));
                        galleryIndex++;
                        break;
                    case 'post':
                        markdown.push(yield this._genOutputMdPost(paragraph.content.postUuid));
                        break;
                    case 'paragraph':
                        markdown.push(paragraph.content);
                        break;
                    default:
                        throw new Error('Invalid paragraph.type');
                }
            }
            return markdown.join('\n');
        });
    }
    _genTagsStr() {
        return this._result.tags.join(' ');
    }
    _genOutputMdImage(image) {
        return __awaiter(this, void 0, void 0, function* () {
            const source = LibPath.join(const_1.DAYONE_PHOTO_PATH, image.dayoneFileName);
            const dest = LibPath.join(this._postAssetsDir, image.newFileName);
            yield this._copyFile(source, dest);
            return `![[${image.newFileName}]]`;
        });
    }
    _genOutputMdGallery(images, galleryIndex) {
        return __awaiter(this, void 0, void 0, function* () {
            const galleryName = this._genGalleryDirName(galleryIndex);
            const galleryDir = LibPath.join(this._postAssetsDir, galleryName);
            yield mkdirp(galleryDir);
            for (const image of images) {
                const source = LibPath.join(const_1.DAYONE_PHOTO_PATH, image.dayoneFileName);
                const dest = LibPath.join(galleryDir, image.newFileName);
                yield this._copyFile(source, dest);
            }
            return [
                '```gallery',
                'type=grid',
                `path=${LibPath.join(this._vaultName, this._result.frontmatter.path, const_1.POST_ASSETS_DIR_NAME, galleryName)}`,
                'imgWidth=250',
                'divWidth=100',
                'divAlign=left',
                'reverseOrder=false',
                '```'
            ];
        });
    }
    _genOutputMdPost(postUuid) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = new result_1.ResData();
            const mdHandler = new _90_markdown_handler_1.default();
            const entry = yield db_1.DB.get().entryDetailByUuid(postUuid);
            yield mdHandler.execute(entry.id, result);
            return `[${result.frontmatter.title}](${result.frontmatter.slug}.md)`;
        });
    }
    _genGalleryDirName(galleryIndex) {
        return `gallery${util_1.padNumLeft0(galleryIndex, 2)}`;
    }
    _copyFile(source, dest) {
        return __awaiter(this, void 0, void 0, function* () {
            // stub for unit test
            return LibFs.copyFile(source, dest);
        });
    }
    _genMarkdownFile() {
        return __awaiter(this, void 0, void 0, function* () {
            const filePath = LibPath.join(this._postDir, this._result.frontmatter.slug + '.md');
            yield LibFs.writeFile(filePath, this._frontmatter + '\n' + this._markdown + '\n' + this._tags);
        });
    }
}
exports.Generator = Generator;
//# sourceMappingURL=generator.js.map