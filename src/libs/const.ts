import * as LibPath from 'path';
import * as LibOs from 'os';

export const DAYONE_HOME = LibPath.join(LibOs.homedir(), '/Library/Group Containers/5U8NS4GX82.dayoneapp2');
export const DAYONE_DOC_PATH = LibPath.join(DAYONE_HOME, 'Data/Documents');
export const DAYONE_PHOTO_PATH = LibPath.join(DAYONE_DOC_PATH, 'DayOnePhotos');
