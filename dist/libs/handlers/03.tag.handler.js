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
class TagHandler extends handler_1.Handler {
    execute(entryId, result) {
        return __awaiter(this, void 0, void 0, function* () {
            const entry = yield db_1.DB.get().entryDetailById(entryId);
            result.tags.push(util_1.genTagYear(entry.year));
            result.tags.push(...util_1.genTagMonth(entry.year, entry.month));
            result.tags.push(...util_1.genTagDay(entry.year, entry.month, entry.day));
            const tags = yield db_1.DB.get().entryTagIds(entryId);
            if (tags.length <= 0) {
                // no tags in this entry, skip
                return;
            }
            for (const tag of tags) {
                const tagDetail = yield db_1.DB.get().tagDetail(tag.tagId);
                result.tags.push(util_1.genTagStr(tagDetail.name));
            }
        });
    }
}
exports.default = TagHandler;
//# sourceMappingURL=03.tag.handler.js.map