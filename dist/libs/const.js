"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST_ASSETS_DIR_NAME = exports.DAYONE_PHOTO_PATH = exports.DAYONE_DB_PATH = exports.DAYONE_DOC_PATH = exports.DAYONE_HOME = exports.DAYONE_TIMESTAMP_GAP = exports.DEFAULT_ACTION = void 0;
const LibPath = require("path");
const LibOs = require("os");
exports.DEFAULT_ACTION = 'execute';
exports.DAYONE_TIMESTAMP_GAP = 31; // 31 years
exports.DAYONE_HOME = LibPath.join(LibOs.homedir(), '/Library/Group Containers/5U8NS4GX82.dayoneapp2');
exports.DAYONE_DOC_PATH = LibPath.join(exports.DAYONE_HOME, 'Data/Documents');
exports.DAYONE_DB_PATH = LibPath.join(exports.DAYONE_DOC_PATH, 'DayOne.sqlite');
exports.DAYONE_PHOTO_PATH = LibPath.join(exports.DAYONE_DOC_PATH, 'DayOnePhotos');
exports.POST_ASSETS_DIR_NAME = 'assets';
//# sourceMappingURL=const.js.map