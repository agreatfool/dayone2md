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
exports.Processor = void 0;
const LibFs = require("fs");
const LibPath = require("path");
const db_1 = require("./db");
const result_1 = require("./result");
const generator_1 = require("./generator");
class Processor {
    constructor(dest, mapping) {
        this._dest = dest;
        this._mapping = mapping;
        this._handlers = [];
    }
    static get(dest, mapping) {
        if (!Processor._instance) {
            if (!dest || !mapping) {
                throw new Error('Processor instance not found, in this case params are required');
            }
            Processor._instance = new Processor(dest, mapping);
        }
        return Processor._instance;
    }
    getDest() {
        return this._dest;
    }
    getMapping() {
        return this._mapping;
    }
    process() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Start to process ...');
            // load handlers
            yield this._loadHandlers();
            const ids = yield db_1.DB.get().entryAllIds();
            const total = ids.length;
            for (const [index, idRecord] of ids.entries()) {
                console.log(`Start to process entry: ${idRecord.id} , ${index} / ${total} ...`);
                yield this._processSingleEntry(idRecord.id);
            }
        });
    }
    _loadHandlers() {
        return __awaiter(this, void 0, void 0, function* () {
            const handlersPath = LibPath.join(__dirname, 'handlers');
            const handlerFileNames = yield LibFs.promises.readdir(handlersPath);
            for (const handlerFileName of handlerFileNames) {
                if (handlerFileName.endsWith('.map')) {
                    continue; // ignore map file
                }
                const fullPath = LibPath.join(handlersPath, handlerFileName);
                const handlerModule = require(fullPath); // { default: SomeHandlerClass }
                this._handlers.push(new handlerModule.default());
            }
        });
    }
    _processSingleEntry(entryId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = new result_1.ResData();
            for (const handlerInstance of this._handlers) {
                yield handlerInstance.execute(entryId, result);
            }
            yield new generator_1.Generator().execute(result);
        });
    }
}
exports.Processor = Processor;
//# sourceMappingURL=processor.js.map