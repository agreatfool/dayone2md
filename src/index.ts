#!/usr/bin/env node

import * as LibFs from 'fs';
import * as LibOs from 'os';
import { Command } from 'commander';
import { DAYONE_HOME } from './libs/const';
import { Processor } from './libs/processor';

const program = new Command();
const pkg = require('../package.json');

program
  .version(pkg.version)
  .description('Dayone2md application, supports only MacOS & Dayone2')
  .requiredOption('-d, --dest <dir>', 'directory of output destination')
  .parse(process.argv);

const options = program.opts();
const CMD_ARGS_DEST = options.dest;

class DayOne2MD {
  public async run() {
    console.log('Dayone2md starting ...');
    await this._validate();
    await new Processor(CMD_ARGS_DEST).process();
  }

  private async _validate() {
    console.log('Validating ...');
    if (LibOs.platform() !== 'darwin') {
      console.log('Only MacOS supported!');
      process.exit(1);
    }
    if (!LibFs.statSync(DAYONE_HOME).isDirectory()) {
      console.log(`No Dayone2 data found, home shall be: ${DAYONE_HOME}`);
      process.exit(1);
    }
    if (!LibFs.statSync(CMD_ARGS_DEST).isDirectory()) {
      console.log('Invalid destination specified!');
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
