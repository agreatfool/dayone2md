import * as LibPath from 'path';
import * as LibOs from 'os';

export const DEFAULT_ACTION = 'execute';

export const DAYONE_TIMESTAMP_GAP = 31; // 31 years

export const DAYONE_HOME = LibPath.join(LibOs.homedir(), '/Library/Group Containers/5U8NS4GX82.dayoneapp2');
export const DAYONE_DOC_PATH = LibPath.join(DAYONE_HOME, 'Data/Documents');
export const DAYONE_DB_PATH = LibPath.join(DAYONE_DOC_PATH, 'DayOne.sqlite');
export const DAYONE_PHOTO_PATH = LibPath.join(DAYONE_DOC_PATH, 'DayOnePhotos');

export const POST_ASSETS_DIR_NAME = 'assets';
