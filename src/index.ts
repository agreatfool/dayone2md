#!/usr/bin/env node

import * as LibFs from 'fs';
import * as LibOs from 'os';
import { Command } from 'commander';
import { DAYONE_DB_PATH, DAYONE_HOME, DEFAULT_ACTION } from './libs/const';
import { Processor } from './libs/processor';
import { DB } from './libs/db';
import { loadPostTitleSlugMappingJson } from './libs/util';
import { MappingConfigGenerator } from './libs/mapping';

const program = new Command();
const pkg = require('../package.json');

program
  .version(pkg.version)
  .description('Dayone2md application, supports only MacOS & Dayone2')
  .requiredOption('-d, --dest <dir>', 'directory of output destination')
  .option('-m, --mapping <path>', 'file path of the post title slug mapping json file')
  .option('-a, --action <action>', 'which action will be executed: execute | mapping', DEFAULT_ACTION)
  .parse(process.argv);

const options = program.opts();
const CMD_ARGS_DEST = options.dest;
const CMD_ARGS_MAPPING_PATH = options.mapping;
const CMD_ARGS_ACTION = options.action;

class DayOne2MD {
  public async run() {
    console.log('Dayone2md starting ...');
    await this._validate();

    await DB.get(DAYONE_DB_PATH).connect();

    switch (CMD_ARGS_ACTION) {
      case 'execute':
        await Processor.get(CMD_ARGS_DEST, loadPostTitleSlugMappingJson(CMD_ARGS_MAPPING_PATH)).process();
        break;
      case 'mapping':
        await new MappingConfigGenerator(CMD_ARGS_DEST).process();
        break;
      default:
        throw new Error('Invalid Action specified');
    }
  }

  private async _validate() {
    console.log('Validating ...');
    if (LibOs.platform() !== 'darwin') {
      console.log('Only MacOS supported!');
      process.exit(1);
    }
    if (!LibFs.existsSync(DAYONE_HOME) || !LibFs.statSync(DAYONE_HOME).isDirectory()) {
      console.log(`No Dayone2 data found, home shall be: ${DAYONE_HOME}`);
      process.exit(1);
    }
    if (!LibFs.existsSync(DAYONE_DB_PATH) || !LibFs.statSync(DAYONE_DB_PATH).isFile()) {
      console.log(`No Dayone2 database found, shall be: ${DAYONE_DB_PATH}`);
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
  }
}

new DayOne2MD().run().catch((_) => console.log(_));

process.on('uncaughtException', (error) => {
  console.error(`Process on uncaughtException error = ${error.stack}`);
});

process.on('unhandledRejection', (error) => {
  console.error(`Process on unhandledRejection error`, error);
});
