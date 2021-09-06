import { DAYONE_DB_PATH } from '../libs/const';
import { DB } from '../libs/db';
import { expect } from 'chai';
import { Database } from 'sqlite';
import * as sinon from 'sinon';

describe('db.ts', function () {
  before(function () {
    console.log(
      '[db.spec.ts] will only work when you have installed dayone2 and have some posts existing, also needs some post to contains: weather, location, tags and attachments'
    );
  });
  beforeEach(function () {
    // reset all the mock
    sinon.restore();
    // clear db cache
    if (DB['_instance'] !== undefined) {
      const instance = DB.get();
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      instance['_cache'] = {};
    }
  });
  afterEach(() => sinon.restore());

  describe('static instance', function () {
    it('should be able to generate static instance', function () {
      expect(DB['_instance']).to.be.equal(undefined);
      const instance = DB.get(DAYONE_DB_PATH);
      expect(instance).to.be.instanceOf(DB);
      expect(instance).to.have.property('_dbPath', DAYONE_DB_PATH);
      expect(DB['_instance']).to.be.instanceOf(DB);
      expect(DB.get()).to.be.instanceOf(DB);
    });
  });

  describe('connect', function () {
    it('should be able to connect to dayone2 db', async function () {
      const instance = DB.get();
      expect(instance['_conn']).to.be.equal(undefined);
      await instance.connect();
      expect(instance['_conn']).to.be.instanceOf(Database);
    });
  });

  describe('_saveCache', function () {
    it('should be able to save data in cache', function () {
      const instance = DB.get();
      const _saveCache = instance['_saveCache'].bind(instance);
      expect(instance['_cache']).to.be.eql({});
      _saveCache('type_name', 'search_name', 'cache_value');
      expect(instance['_cache']).to.be.eql({ type_name: { search_name: 'cache_value' } });
    });
  });

  describe('_getCache', function () {
    it('should be able to get data from cache', function () {
      const instance = DB.get();
      const _saveCache = instance['_saveCache'].bind(instance);
      const _getCache = instance['_getCache'].bind(instance);
      expect(instance['_cache']).to.be.eql({});
      _saveCache('type_name', 'search_name', 'cache_value');
      expect(_getCache('type_name', 'search_name')).to.be.equal('cache_value');
    });
  });

  describe('entryAllIds', function () {
    it('should be good to be queried', async function () {
      const instance = DB.get();
      const _getCache = instance['_getCache'].bind(instance);
      const res = await instance.entryAllIds();

      expect(res).to.be.an('array');
      for (const idRecord of res) {
        expect(idRecord).to.have.property('id');
        expect(idRecord.id).to.be.an('number');
      }
      expect(res).to.be.eql(_getCache('entryAllIds', 'all'));

      const spy = sinon.spy(instance['_conn'], 'all');
      await instance.entryAllIds();
      expect(spy.callCount).to.be.equal(0);
    });
  });

  describe('entryDetailById', function () {
    it('should be good to be queried', async function () {
      const instance = DB.get();
      const _getCache = instance['_getCache'].bind(instance);
      const ids = await instance.entryAllIds();
      const targetId = ids.shift().id;
      const res = await instance.entryDetailById(targetId);

      expect(res).to.have.all.keys('id', 'uuid', 'year', 'month', 'day', 'locationId', 'weatherId', 'createdTime', 'markdown');
      expect(res.id).to.be.equal(targetId);
      expect(res.uuid).to.be.an('string');
      expect(res.year).to.be.an('number');
      expect(res.month).to.be.an('number');
      expect(res.day).to.be.an('number');
      expect(res.createdTime).to.be.an('number');
      expect(res.markdown).to.be.an('string');
      expect(_getCache('entryDetailById', targetId)).to.be.eql(res);

      const spy = sinon.spy(instance['_conn'], 'get');
      await instance.entryDetailById(targetId);
      expect(spy.callCount).to.be.equal(0);
    });
  });

  describe('entryDetailByUuid', function () {
    it('should be good to be queried', async function () {
      const instance = DB.get();
      const _getCache = instance['_getCache'].bind(instance);
      const ids = await instance.entryAllIds();
      const targetId = ids.shift().id;
      const detail = await instance.entryDetailById(targetId);
      const uuid = detail.uuid;
      const res = await instance.entryDetailByUuid(uuid);

      expect(res).to.have.all.keys('id', 'uuid', 'year', 'month', 'day', 'locationId', 'weatherId', 'createdTime', 'markdown');
      expect(res.id).to.be.equal(targetId);
      expect(res.uuid).to.be.equal(uuid);
      expect(res.year).to.be.an('number');
      expect(res.month).to.be.an('number');
      expect(res.day).to.be.an('number');
      expect(res.createdTime).to.be.an('number');
      expect(res.markdown).to.be.an('string');
      expect(_getCache('entryDetailByUuid', uuid)).to.be.eql(res);

      const spy = sinon.spy(instance['_conn'], 'get');
      await instance.entryDetailByUuid(uuid);
      expect(spy.callCount).to.be.equal(0);
    });
  });

  describe('weatherDetail', function () {
    it('should be good to be queried', async function () {
      const instance = DB.get();
      const _getCache = instance['_getCache'].bind(instance);
      const ids = await instance.entryAllIds();
      let entryId;
      let weatherId;
      for (const idRecord of ids) {
        const entry = await instance.entryDetailById(idRecord.id);
        if (entry.weatherId) {
          entryId = entry.id;
          weatherId = entry.weatherId;
          break;
        }
      }
      const res = await instance.weatherDetail(weatherId);

      expect(res).to.have.all.keys('id', 'entryId', 'humidity', 'temperature', 'weather');
      expect(res.id).to.be.equal(weatherId);
      expect(res.entryId).to.be.equal(entryId);
      expect(res.humidity).to.be.an('number');
      expect(res.temperature).to.be.an('number');
      expect(res.weather).to.be.an('string');
      expect(_getCache('weatherDetail', weatherId)).to.be.eql(res);

      const spy = sinon.spy(instance['_conn'], 'get');
      await instance.weatherDetail(weatherId);
      expect(spy.callCount).to.be.equal(0);
    });
  });

  describe('locationDetail', function () {
    it('should be good to be queried', async function () {
      const instance = DB.get();
      const _getCache = instance['_getCache'].bind(instance);
      const ids = await instance.entryAllIds();
      let locationId;
      for (const idRecord of ids) {
        const entry = await instance.entryDetailById(idRecord.id);
        if (entry.locationId) {
          locationId = entry.locationId;
          break;
        }
      }
      const res = await instance.locationDetail(locationId);

      expect(res).to.have.all.keys('id', 'altitude', 'latitude', 'longitude', 'address', 'placename', 'province', 'city', 'country');
      expect(res.id).to.be.equal(locationId);
      expect(res.latitude).to.be.an('number');
      expect(res.longitude).to.be.an('number');
      expect(_getCache('locationDetail', locationId)).to.be.eql(res);

      const spy = sinon.spy(instance['_conn'], 'get');
      await instance.locationDetail(locationId);
      expect(spy.callCount).to.be.equal(0);
    });
  });

  describe('tagDetail & entryTagIds', function () {
    it('should be good to be queried', async function () {
      const instance = DB.get();
      const _getCache = instance['_getCache'].bind(instance);
      const ids = await instance.entryAllIds();
      let entryId;
      const tagIds: number[] = [];

      // entryTagIds
      for (const idRecord of ids) {
        const resIds = await instance.entryTagIds(idRecord.id);
        if (resIds.length > 0) {
          for (const resId of resIds) {
            entryId = idRecord.id;
            expect(resId).to.have.property('tagId');
            expect(resId.tagId).to.be.an('number');
            tagIds.push(resId.tagId);
          }
          expect(_getCache('entryTagIds', entryId)).to.be.eql(resIds);
          break;
        }
      }

      // tagDetail
      for (const tagId of tagIds) {
        const tag = await instance.tagDetail(tagId);
        expect(tag).to.have.all.keys('id', 'name');
        expect(tag.id).to.be.equal(tagId);
        expect(tag.name).to.be.an('string');
        expect(_getCache('tagDetail', tagId)).to.be.eql(tag);
      }

      const spy1 = sinon.spy(instance['_conn'], 'all');
      await instance.entryTagIds(entryId);
      expect(spy1.callCount).to.be.equal(0);
      const spy2 = sinon.spy(instance['_conn'], 'get');
      await instance.tagDetail(tagIds[0]);
      expect(spy2.callCount).to.be.equal(0);

      expect(tagIds.length > 0).to.be.true;
    });
  });

  describe('entryAttachments & attachmentDetail', function () {
    it('should be good to be queried', async function () {
      const instance = DB.get();
      const _getCache = instance['_getCache'].bind(instance);
      const ids = await instance.entryAllIds();
      let entryId;
      const attachmentUuids: string[] = [];

      // entryTagIds
      for (const idRecord of ids) {
        const resAttas = await instance.entryAttachments(idRecord.id);
        if (resAttas.length > 0) {
          for (const resAtta of resAttas) {
            entryId = idRecord.id;
            expect(resAtta).to.have.all.keys('id', 'entryId', 'uuid', 'filename', 'filetype');
            expect(resAtta.entryId).to.be.equal(entryId);
            expect(resAtta.uuid).to.be.an('string');
            expect(resAtta.filename).to.be.an('string');
            expect(resAtta.filetype).to.be.an('string');
            attachmentUuids.push(resAtta.uuid);
          }
          expect(_getCache('entryAttachments', entryId)).to.be.eql(resAttas);
          break;
        }
      }

      // attachmentDetail
      for (const uuid of attachmentUuids) {
        const atta = await instance.attachmentDetail(uuid);
        expect(atta).to.have.all.keys('id', 'entryId', 'uuid', 'filename', 'filetype');
        expect(atta.entryId).to.be.equal(entryId);
        expect(atta.uuid).to.be.equal(uuid);
        expect(atta.filename).to.be.an('string');
        expect(atta.filetype).to.be.an('string');
        expect(_getCache('attachmentDetail', uuid)).to.be.eql(atta);
      }

      const spy1 = sinon.spy(instance['_conn'], 'all');
      await instance.entryAttachments(entryId);
      expect(spy1.callCount).to.be.equal(0);
      const spy2 = sinon.spy(instance['_conn'], 'get');
      await instance.attachmentDetail(attachmentUuids[0]);
      expect(spy2.callCount).to.be.equal(0);

      expect(attachmentUuids.length > 0).to.be.true;
    });
  });
});
