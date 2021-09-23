#!/usr/bin/env node
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
const LibFs = require("fs");
const LibOs = require("os");
const commander_1 = require("commander");
const const_1 = require("./libs/const");
const processor_1 = require("./libs/processor");
const db_1 = require("./libs/db");
const util_1 = require("./libs/util");
const mapping_1 = require("./libs/mapping");
const program = new commander_1.Command();
const pkg = require('../package.json');
program
    .version(pkg.version)
    .description('Dayone2md application, supports only MacOS & Dayone2')
    .requiredOption('-d, --dest <dir>', 'directory of output destination')
    .option('-m, --mapping <path>', 'file path of the post title slug mapping json file')
    .option('-a, --action <action>', 'which action will be executed: execute | mapping', const_1.DEFAULT_ACTION)
    .parse(process.argv);
const options = program.opts();
const CMD_ARGS_DEST = options.dest;
const CMD_ARGS_MAPPING_PATH = options.mapping;
const CMD_ARGS_ACTION = options.action;
class DayOne2MD {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Dayone2md starting ...');
            yield this._validate();
            yield db_1.DB.get(const_1.DAYONE_DB_PATH).connect();
            switch (CMD_ARGS_ACTION) {
                case 'execute':
                    yield processor_1.Processor.get(CMD_ARGS_DEST, util_1.loadPostTitleSlugMappingJson(CMD_ARGS_MAPPING_PATH)).process();
                    break;
                case 'mapping':
                    yield new mapping_1.MappingConfigGenerator(CMD_ARGS_DEST).process();
                    break;
                default:
                    throw new Error('Invalid Action specified');
            }
        });
    }
    _validate() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Validating ...');
            if (LibOs.platform() !== 'darwin') {
                console.log('Only MacOS supported!');
                process.exit(1);
            }
            if (!LibFs.existsSync(const_1.DAYONE_HOME) || !LibFs.statSync(const_1.DAYONE_HOME).isDirectory()) {
                console.log(`No Dayone2 data found, home shall be: ${const_1.DAYONE_HOME}`);
                process.exit(1);
            }
            if (!LibFs.existsSync(const_1.DAYONE_DB_PATH) || !LibFs.statSync(const_1.DAYONE_DB_PATH).isFile()) {
                console.log(`No Dayone2 database found, shall be: ${const_1.DAYONE_DB_PATH}`);
                process.exit(1);
            }
            if (!LibFs.existsSync(CMD_ARGS_DEST) || !LibFs.statSync(CMD_ARGS_DEST).isDirectory()) {
                console.log('Invalid destination specified!');
                process.exit(1);
            }
            if (CMD_ARGS_MAPPING_PATH && (!LibFs.existsSync(CMD_ARGS_MAPPING_PATH) || !LibFs.statSync(CMD_ARGS_MAPPING_PATH).isFile())) {
                console.log(`Wrong mapping file path given: ${CMD_ARGS_MAPPING_PATH}`);
                process.exit(1);
            }
            if (!['execute', 'mapping'].includes(CMD_ARGS_ACTION)) {
                console.log('Invalid Action specified');
                process.exit(1);
            }
        });
    }
}
new DayOne2MD().run().catch((_) => console.log(_));
process.on('uncaughtException', (error) => {
    console.error(`Process on uncaughtException error = ${error.stack}`);
});
process.on('unhandledRejection', (error) => {
    console.error(`Process on unhandledRejection error`, error);
});
//# sourceMappingURL=index.js.map