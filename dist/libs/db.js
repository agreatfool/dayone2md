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
exports.DB = void 0;
const sqlite3 = require("sqlite3");
const sqlite_1 = require("sqlite");
class DB {
    constructor(dbPath) {
        this._dbPath = dbPath;
        this._cache = {};
    }
    static get(dbPath) {
        if (!DB._instance) {
            if (!dbPath) {
                throw new Error('DB instance not found, in this case dbPath is required');
            }
            DB._instance = new DB(dbPath);
        }
        return DB._instance;
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Start to connect to db: ${this._dbPath}`);
            this._conn = yield sqlite_1.open({
                filename: this._dbPath,
                driver: sqlite3.Database
            });
            console.log('DB connected');
            return this;
        });
    }
    _saveCache(type, search, result) {
        if (!(type in this._cache)) {
            this._cache[type] = {};
        }
        if (search in this._cache[type]) {
            // already saved
            return;
        }
        this._cache[type][search] = result;
    }
    _getCache(type, search) {
        if (!(type in this._cache)) {
            return null;
        }
        if (!(search in this._cache[type])) {
            return null;
        }
        return this._cache[type][search];
    }
    entryAllIds() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._conn) {
                throw new Error('No db connection');
            }
            const cache = this._getCache('entryAllIds', 'all');
            if (cache) {
                return cache;
            }
            const result = yield this._conn.all('SELECT Z_PK as id FROM ZENTRY;');
            this._saveCache('entryAllIds', 'all', result);
            return result;
        });
    }
    entryDetailById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._conn) {
                throw new Error('No db connection');
            }
            const cache = this._getCache('entryDetailById', id);
            if (cache) {
                return cache;
            }
            const result = yield this._conn.get(`SELECT Z_PK as id, ZUUID as uuid, ZGREGORIANDAY as day, ZGREGORIANMONTH as month, ZGREGORIANYEAR as year, ZLOCATION as locationId, ZWEATHER as weatherId, ZCREATIONDATE as createdTime, ZMARKDOWNTEXT as markdown FROM ZENTRY WHERE Z_PK = ${id};`);
            this._saveCache('entryDetailById', id, result);
            return result;
        });
    }
    entryDetailByUuid(uuid) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._conn) {
                throw new Error('No db connection');
            }
            const cache = this._getCache('entryDetailByUuid', uuid);
            if (cache) {
                return cache;
            }
            const result = yield this._conn.get(`SELECT Z_PK as id, ZUUID as uuid, ZGREGORIANDAY as day, ZGREGORIANMONTH as month, ZGREGORIANYEAR as year, ZLOCATION as locationId, ZWEATHER as weatherId, ZCREATIONDATE as createdTime, ZMARKDOWNTEXT as markdown FROM ZENTRY WHERE ZUUID = "${uuid}";`);
            this._saveCache('entryDetailByUuid', uuid, result);
            return result;
        });
    }
    weatherDetail(id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._conn) {
                throw new Error('No db connection');
            }
            const cache = this._getCache('weatherDetail', id);
            if (cache) {
                return cache;
            }
            const result = yield this._conn.get(`SELECT Z_PK as id, ZENTRY as entryId, ZRELATIVEHUMIDITY as humidity, ZTEMPERATURECELSIUS as temperature, ZCONDITIONSDESCRIPTION as weather FROM ZWEATHER WHERE Z_PK = ${id};`);
            this._saveCache('weatherDetail', id, result);
            return result;
        });
    }
    locationDetail(id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._conn) {
                throw new Error('No db connection');
            }
            const cache = this._getCache('locationDetail', id);
            if (cache) {
                return cache;
            }
            const result = yield this._conn.get(`SELECT Z_PK as id, ZALTITUDE as altitude, ZLATITUDE as latitude, ZLONGITUDE as longitude, ZADDRESS as address, ZPLACENAME as placename, ZADMINISTRATIVEAREA as province, ZLOCALITYNAME as city, ZCOUNTRY as country FROM ZLOCATION WHERE Z_PK = ${id};`);
            this._saveCache('locationDetail', id, result);
            return result;
        });
    }
    tagDetail(id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._conn) {
                throw new Error('No db connection');
            }
            const cache = this._getCache('tagDetail', id);
            if (cache) {
                return cache;
            }
            const result = yield this._conn.get(`SELECT Z_PK as id, ZNAME as name FROM ZTAG WHERE Z_PK = ${id};`);
            this._saveCache('tagDetail', id, result);
            return result;
        });
    }
    entryTagIds(entryId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._conn) {
                throw new Error('No db connection');
            }
            const cache = this._getCache('entryTagIds', entryId);
            if (cache) {
                return cache;
            }
            const result = yield this._conn.all(`SELECT Z_44TAGS1 as tagId FROM Z_12TAGS WHERE Z_12ENTRIES = ${entryId};`);
            this._saveCache('entryTagIds', entryId, result);
            return result;
        });
    }
    entryAttachments(entryId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._conn) {
                throw new Error('No db connection');
            }
            const cache = this._getCache('entryAttachments', entryId);
            if (cache) {
                return cache;
            }
            const result = yield this._conn.all(`SELECT Z_PK as id, ZENTRY as entryId, ZIDENTIFIER as uuid, ZMD5 as filename, ZTYPE as filetype FROM ZATTACHMENT WHERE ZENTRY = ${entryId};`);
            this._saveCache('entryAttachments', entryId, result);
            return result;
        });
    }
    attachmentDetail(uuid) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._conn) {
                throw new Error('No db connection');
            }
            const cache = this._getCache('attachmentDetail', uuid);
            if (cache) {
                return cache;
            }
            const result = yield this._conn.get(`SELECT Z_PK as id, ZENTRY as entryId, ZIDENTIFIER as uuid, ZMD5 as filename, ZTYPE as filetype FROM ZATTACHMENT WHERE ZIDENTIFIER = "${uuid}";`);
            this._saveCache('attachmentDetail', uuid, result);
            return result;
        });
    }
}
exports.DB = DB;
//# sourceMappingURL=db.js.map