"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertDayoneAttachment2ResMarkdownImage = exports.isStringContainsCn = exports.removeIndexFromArr = exports.removeDayoneRowTitleMark = exports.trimDayoneRow = exports.isStringDayonePost = exports.isStringDayoneImage = exports.loadPostTitleSlugMappingJson = exports.uuidv4 = exports.genPostDirStr = exports.genDateStr = exports.genTagDay = exports.genTagMonth = exports.genTagYear = exports.genTagStr = exports.padNumLeft0 = void 0;
const LibFs = require("fs");
const uuid_1 = require("uuid");
const padNumLeft0 = (num, length) => {
    // (5, 4) => '0005'
    let str = String(num);
    const gap = length - str.length;
    if (gap > 0) {
        str = new Array(gap + 1).join('0') + str;
    }
    return str;
};
exports.padNumLeft0 = padNumLeft0;
const genTagStr = (tagName) => {
    return `#${tagName}`;
};
exports.genTagStr = genTagStr;
const genTagYear = (year) => {
    return exports.genTagStr(`Y${year}`);
};
exports.genTagYear = genTagYear;
const genTagMonth = (year, month) => {
    const monthStr = exports.padNumLeft0(month, 2);
    return [exports.genTagStr(`M${year}${monthStr}`), exports.genTagStr(`M${monthStr}`)];
};
exports.genTagMonth = genTagMonth;
const genTagDay = (year, month, day) => {
    const monthStr = exports.padNumLeft0(month, 2);
    const dayStr = exports.padNumLeft0(day, 2);
    return [exports.genTagStr(`D${year}${monthStr}${dayStr}`), exports.genTagStr(`D${monthStr}${dayStr}`)];
};
exports.genTagDay = genTagDay;
const genDateStr = (year, month, day) => {
    return `${year}-${exports.padNumLeft0(month, 2)}-${exports.padNumLeft0(day, 2)}`;
};
exports.genDateStr = genDateStr;
const genPostDirStr = (year, month, day, slug) => {
    const monthStr = exports.padNumLeft0(month, 2);
    const dayStr = exports.padNumLeft0(day, 2);
    return `/${year}/${monthStr}/${year + monthStr + dayStr}-${slug}`;
};
exports.genPostDirStr = genPostDirStr;
const uuidv4 = () => {
    return uuid_1.v4().replace(/-/g, '').toUpperCase();
};
exports.uuidv4 = uuidv4;
const loadPostTitleSlugMappingJson = (path) => {
    const mapping = new Map();
    if (path && LibFs.existsSync(path) && LibFs.statSync(path).isFile()) {
        const content = LibFs.readFileSync(path).toString();
        try {
            const pairs = JSON.parse(content);
            for (const [title, slug] of Object.entries(pairs)) {
                mapping.set(title, slug);
            }
        }
        catch (err) {
            console.log('Wrong mapping file content, non-json, skip it ...', err);
        }
    }
    return mapping;
};
exports.loadPostTitleSlugMappingJson = loadPostTitleSlugMappingJson;
const isStringDayoneImage = (row) => {
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
exports.isStringDayoneImage = isStringDayoneImage;
const isStringDayonePost = (row) => {
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
exports.isStringDayonePost = isStringDayonePost;
const trimDayoneRow = (row) => {
    return row.trim().replace(/\\/g, '');
};
exports.trimDayoneRow = trimDayoneRow;
const removeDayoneRowTitleMark = (row) => {
    /**
     * #h1-title | ## h2-title | ...
     * =>
     * h1-title | h2-title | ...
     */
    return row.replace(/^#+/, '').trim();
};
exports.removeDayoneRowTitleMark = removeDayoneRowTitleMark;
const removeIndexFromArr = (arr, index) => {
    if (index > -1) {
        arr.splice(index, 1);
    }
};
exports.removeIndexFromArr = removeIndexFromArr;
const isStringContainsCn = (str) => {
    return /[\u3400-\u9FBF]/.test(str);
};
exports.isStringContainsCn = isStringContainsCn;
const convertDayoneAttachment2ResMarkdownImage = (attachment, postUuid, markdown) => {
    const counter = markdown.imageCounter;
    const imageFileName = `${attachment.filename}.${attachment.filetype}`;
    const res = {
        indexInEntry: counter,
        dayoneFileName: imageFileName,
        newFileName: `${postUuid}_${exports.padNumLeft0(counter, 4)}.${attachment.filetype}`,
        attachment
    };
    markdown.imageCounter++;
    return res;
};
exports.convertDayoneAttachment2ResMarkdownImage = convertDayoneAttachment2ResMarkdownImage;
//# sourceMappingURL=util.js.map