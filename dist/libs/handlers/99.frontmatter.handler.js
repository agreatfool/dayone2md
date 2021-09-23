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
class FrontmatterHandler extends handler_1.Handler {
    execute(entryId, result) {
        return __awaiter(this, void 0, void 0, function* () {
            // title & slug would be filled already in markdown handler, since they are all parsed from markdown text
            const entry = yield db_1.DB.get().entryDetailById(entryId);
            result.frontmatter.path = util_1.genPostDirStr(entry.year, entry.month, entry.day, result.frontmatter.slug);
            result.frontmatter.date = util_1.genDateStr(entry.year, entry.month, entry.day);
            result.frontmatter.location = result.location;
            result.frontmatter.weather = result.weather;
        });
    }
}
exports.default = FrontmatterHandler;
//# sourceMappingURL=99.frontmatter.handler.js.map