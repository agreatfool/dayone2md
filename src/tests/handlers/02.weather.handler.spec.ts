import * as sinon from 'sinon';
import { DB } from '../../libs/db';
import { DAYONE_DB_PATH } from '../../libs/const';
import { DayoneEntry, DayoneWeather } from '../../libs/models';
import { ResData, ResWeather } from '../../libs/result';
import { expect } from 'chai';
import WeatherHandler from '../../libs/handlers/02.weather.handler';
import * as R from 'ramda';

describe('02.weather.handler.ts', function () {
  beforeEach(() => sinon.restore());
  afterEach(() => sinon.restore());

  describe('execute', function () {
    it('should be good', async function () {
      const db = DB.get(DAYONE_DB_PATH);
      const entryId = 12;
      const weatherId = 132;
      const weather = {
        id: weatherId,
        entryId,
        humidity: 48,
        temperature: 27,
        time: '22:52:00',
        weather: 'good'
      } as DayoneWeather;
      sinon.stub(db, 'entryDetailById').callsFake(async function (id: number): Promise<DayoneEntry> {
        expect(id).to.be.equal(entryId);
        return {
          id,
          uuid: 'CC08EAA4F4B144EBBA74E416DCDB0B66',
          year: 2020,
          month: 9,
          day: 11,
          locationId: null,
          weatherId: weatherId,
          createdTime: 651855120,
          markdown: ''
        } as DayoneEntry;
      });
      sinon.stub(db, 'weatherDetail').callsFake(async function (id: number): Promise<DayoneWeather> {
        expect(id).to.be.equal(weatherId);
        return weather;
      });

      const handler = new WeatherHandler();
      const res = new ResData();
      await handler.execute(entryId, res);

      expect(res).to.have.property('weather');
      expect(res.weather).to.be.instanceOf(ResWeather);

      const expected = R.omit(['id', 'entryId'], Object.assign({ aqi: null }, weather));
      expect(res.weather).to.be.eql(expected);

      sinon.restore();
    });
  });
});
