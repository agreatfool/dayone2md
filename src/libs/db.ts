import * as sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { DayoneAttachment, DayoneEntry, DayoneEntryId, DayoneLocation, DayoneTag, DayoneTagId, DayoneWeather } from './models';

type DBQueryMethod =
  | 'entryAllIds'
  | 'entryDetailById'
  | 'entryDetailByUuid'
  | 'weatherDetail'
  | 'locationDetail'
  | 'tagDetail'
  | 'entryTagIds'
  | 'entryAttachments'
  | 'attachmentDetail';
type DBSearch = string | number;
type DBResult = DayoneEntryId[] | DayoneEntry | DayoneWeather | DayoneLocation | DayoneTag | DayoneTagId[] | DayoneAttachment[] | DayoneAttachment;
type DBCache = {
  [cacheType in DBQueryMethod]: {
    [search in DBSearch]: DBResult;
  };
};

export class DB {
  private static _instance: DB;
  public static get(dbPath?: string): DB {
    if (!DB._instance) {
      if (!dbPath) {
        throw new Error('DB instance not found, in this case dbPath is required');
      }
      DB._instance = new DB(dbPath);
    }
    return DB._instance;
  }

  private readonly _dbPath: string;
  private _conn: Database;
  private readonly _cache: DBCache;

  constructor(dbPath: string) {
    this._dbPath = dbPath;
    this._cache = {} as DBCache;
  }

  public async connect(): Promise<DB> {
    console.log(`Start to connect to db: ${this._dbPath}`);
    this._conn = await open({
      filename: this._dbPath,
      driver: sqlite3.Database
    });
    console.log('DB connected');

    return this;
  }

  private _saveCache(type: DBQueryMethod, search: DBSearch, result: DBResult) {
    if (!(type in this._cache)) {
      this._cache[type] = {};
    }
    if (search in this._cache[type]) {
      // already saved
      return;
    }
    this._cache[type][search] = result;
  }

  private _getCache(type: DBQueryMethod, search: DBSearch) {
    if (!(type in this._cache)) {
      return null;
    }
    if (!(search in this._cache[type])) {
      return null;
    }
    return this._cache[type][search];
  }

  public async entryAllIds(): Promise<DayoneEntryId[]> {
    if (!this._conn) {
      throw new Error('No db connection');
    }

    const cache = this._getCache('entryAllIds', 'all');
    if (cache) {
      return cache as DayoneEntryId[];
    }
    const result = await this._conn.all('SELECT Z_PK as id FROM ZENTRY;');
    this._saveCache('entryAllIds', 'all', result);

    return result;
  }

  public async entryDetailById(id: number): Promise<DayoneEntry> {
    if (!this._conn) {
      throw new Error('No db connection');
    }

    const cache = this._getCache('entryDetailById', id);
    if (cache) {
      return cache as DayoneEntry;
    }
    const result = await this._conn.get(
      `SELECT Z_PK as id, ZUUID as uuid, ZGREGORIANDAY as day, ZGREGORIANMONTH as month, ZGREGORIANYEAR as year, ZLOCATION as locationId, ZWEATHER as weatherId, ZCREATIONDATE as createdTime, ZMARKDOWNTEXT as markdown FROM ZENTRY WHERE Z_PK = ${id};`
    );
    this._saveCache('entryDetailById', id, result);

    return result;
  }

  public async entryDetailByUuid(uuid: string): Promise<DayoneEntry> {
    if (!this._conn) {
      throw new Error('No db connection');
    }

    const cache = this._getCache('entryDetailByUuid', uuid);
    if (cache) {
      return cache as DayoneEntry;
    }
    const result = await this._conn.get(
      `SELECT Z_PK as id, ZUUID as uuid, ZGREGORIANDAY as day, ZGREGORIANMONTH as month, ZGREGORIANYEAR as year, ZLOCATION as locationId, ZWEATHER as weatherId, ZCREATIONDATE as createdTime, ZMARKDOWNTEXT as markdown FROM ZENTRY WHERE ZUUID = "${uuid}";`
    );
    this._saveCache('entryDetailByUuid', uuid, result);

    return result;
  }

  public async weatherDetail(id: number): Promise<DayoneWeather> {
    if (!this._conn) {
      throw new Error('No db connection');
    }

    const cache = this._getCache('weatherDetail', id);
    if (cache) {
      return cache as DayoneWeather;
    }
    const result = await this._conn.get(
      `SELECT Z_PK as id, ZENTRY as entryId, ZRELATIVEHUMIDITY as humidity, ZTEMPERATURECELSIUS as temperature, ZCONDITIONSDESCRIPTION as weather FROM ZWEATHER WHERE Z_PK = ${id};`
    );
    this._saveCache('weatherDetail', id, result);

    return result;
  }

  public async locationDetail(id: number): Promise<DayoneLocation> {
    if (!this._conn) {
      throw new Error('No db connection');
    }

    const cache = this._getCache('locationDetail', id);
    if (cache) {
      return cache as DayoneLocation;
    }
    const result = await this._conn.get(
      `SELECT Z_PK as id, ZALTITUDE as altitude, ZLATITUDE as latitude, ZLONGITUDE as longitude, ZADDRESS as address, ZPLACENAME as placename, ZADMINISTRATIVEAREA as province, ZLOCALITYNAME as city, ZCOUNTRY as country FROM ZLOCATION WHERE Z_PK = ${id};`
    );
    this._saveCache('locationDetail', id, result);

    return result;
  }

  public async tagDetail(id: number): Promise<DayoneTag> {
    if (!this._conn) {
      throw new Error('No db connection');
    }

    const cache = this._getCache('tagDetail', id);
    if (cache) {
      return cache as DayoneTag;
    }
    const result = await this._conn.get(`SELECT Z_PK as id, ZNAME as name FROM ZTAG WHERE Z_PK = ${id};`);
    this._saveCache('tagDetail', id, result);

    return result;
  }

  public async entryTagIds(entryId: number): Promise<DayoneTagId[]> {
    if (!this._conn) {
      throw new Error('No db connection');
    }

    const cache = this._getCache('entryTagIds', entryId);
    if (cache) {
      return cache as DayoneTagId[];
    }
    const result = await this._conn.all(`SELECT Z_44TAGS1 as tagId FROM Z_12TAGS WHERE Z_12ENTRIES = ${entryId};`);
    this._saveCache('entryTagIds', entryId, result);

    return result;
  }

  public async entryAttachments(entryId: number): Promise<DayoneAttachment[]> {
    if (!this._conn) {
      throw new Error('No db connection');
    }

    const cache = this._getCache('entryAttachments', entryId);
    if (cache) {
      return cache as DayoneAttachment[];
    }
    const result = await this._conn.all(
      `SELECT Z_PK as id, ZENTRY as entryId, ZIDENTIFIER as uuid, ZMD5 as filename, ZTYPE as filetype FROM ZATTACHMENT WHERE ZENTRY = ${entryId};`
    );
    this._saveCache('entryAttachments', entryId, result);

    return result;
  }

  public async attachmentDetail(uuid: string): Promise<DayoneAttachment> {
    if (!this._conn) {
      throw new Error('No db connection');
    }

    const cache = this._getCache('attachmentDetail', uuid);
    if (cache) {
      return cache as DayoneAttachment;
    }
    const result = await this._conn.get(
      `SELECT Z_PK as id, ZENTRY as entryId, ZIDENTIFIER as uuid, ZMD5 as filename, ZTYPE as filetype FROM ZATTACHMENT WHERE ZIDENTIFIER = "${uuid}";`
    );
    this._saveCache('attachmentDetail', uuid, result);

    return result;
  }
}
