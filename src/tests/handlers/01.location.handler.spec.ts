import * as sinon from 'sinon';
import { DB } from '../../libs/db';
import { DAYONE_DB_PATH } from '../../libs/const';
import { DayoneEntry, DayoneLocation } from '../../libs/models';
import LocationHandler from '../../libs/handlers/01.location.handler';
import { ResData, ResLocation } from '../../libs/result';
import { expect } from 'chai';
import * as R from 'ramda';

describe('01.location.handler.ts', function () {
  beforeEach(() => sinon.restore());
  afterEach(() => sinon.restore());

  describe('execute', function () {
    it('should be good', async function () {
      const db = DB.get(DAYONE_DB_PATH);
      const entryId = 12;
      const locationId = 132;
      const location = {
        id: locationId,
        altitude: 1,
        latitude: 33,
        longitude: 121,
        address: 'address_name',
        placename: 'somewhere',
        province: 'shanghai',
        city: 'shanghai',
        country: 'cn'
      } as DayoneLocation;
      sinon.stub(db, 'entryDetailById').callsFake(async function (id: number): Promise<DayoneEntry> {
        expect(id).to.be.equal(entryId);
        return {
          id,
          uuid: 'CC08EAA4F4B144EBBA74E416DCDB0B66',
          year: 2020,
          month: 9,
          day: 11,
          locationId: locationId,
          weatherId: null,
          markdown: ''
        } as DayoneEntry;
      });
      sinon.stub(db, 'locationDetail').callsFake(async function (id: number): Promise<DayoneLocation> {
        expect(id).to.be.equal(locationId);
        return location;
      });

      const handler = new LocationHandler();
      const res = new ResData();
      await handler.execute(entryId, res);

      expect(res).to.have.property('location');
      expect(res.location).to.be.instanceOf(ResLocation);

      const expected = R.omit(['id'], Object.assign({ district: null }, location));
      expect(res.location).to.be.eql(expected);

      sinon.restore();
    });
  });
});
