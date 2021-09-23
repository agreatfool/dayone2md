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
exports.MappingConfigGenerator = void 0;
const LibFs = require("fs/promises");
const LibPath = require("path");
const db_1 = require("./db");
const _90_markdown_handler_1 = require("./handlers/90.markdown.handler");
const util_1 = require("./util");
class MappingConfigGenerator extends _90_markdown_handler_1.default {
    constructor(dest) {
        super();
        this._dest = dest;
    }
    process() {
        return __awaiter(this, void 0, void 0, function* () {
            const config = {};
            const ids = yield db_1.DB.get().entryAllIds();
            for (const idRecord of ids) {
                const entryId = idRecord.id;
                const entry = yield db_1.DB.get().entryDetailById(entryId);
                this._rows = this._splitMdRows(entry.markdown);
                const title = this._fetchTitle();
                if (util_1.isStringContainsCn(title)) {
                    config[title] = '';
                }
            }
            yield LibFs.writeFile(LibPath.join(this._dest, 'mapping.json'), JSON.stringify(config, null, 2));
        });
    }
}
exports.MappingConfigGenerator = MappingConfigGenerator;
//# sourceMappingURL=mapping.js.map