import FrontmatterHandler from '../../libs/handlers/99.frontmatter.handler';
import { ResData, ResLocation, ResWeather } from '../../libs/result';
import { DB } from '../../libs/db';
import { DAYONE_DB_PATH } from '../../libs/const';
import * as sinon from 'sinon';
import { DayoneEntry } from '../../libs/models';
import { expect } from 'chai';

describe('99.formatter.handler.ts', function () {
  beforeEach(() => sinon.restore());
  afterEach(() => sinon.restore());

  describe('execute', function () {
    it('should be good', async function () {
      const db = DB.get(DAYONE_DB_PATH);
      const entryId = 12;
      sinon.stub(db, 'entryDetailById').callsFake(async function (id: number): Promise<DayoneEntry> {
        expect(id).to.be.equal(entryId);
        return {
          id,
          uuid: 'CC08EAA4F4B144EBBA74E416DCDB0B66',
          year: 2020,
          month: 9,
          day: 11,
          locationId: null,
          weatherId: null,
          markdown: ''
        } as DayoneEntry;
      });

      const handler = new FrontmatterHandler();
      const res = new ResData();

      res.frontmatter.slug = 'test-slug';
      const location = new ResLocation();
      location.country = 'CN';
      res.location = location;
      const weather = new ResWeather();
      weather.aqi = 100;
      res.weather = weather;

      await handler.execute(entryId, res);
      expect(res.frontmatter.path).to.be.equal('/2020/09/20200911-test-slug');
      expect(res.frontmatter.date).to.be.equal('2020-09-11');
      expect(res.frontmatter.location).to.be.eql(location);
      expect(res.frontmatter.weather).to.be.eql(weather);
    });
  });
});
