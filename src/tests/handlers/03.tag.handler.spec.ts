import * as sinon from 'sinon';
import { DB } from '../../libs/db';
import { DAYONE_DB_PATH } from '../../libs/const';
import { DayoneEntry, DayoneTag, DayoneTagId } from '../../libs/models';
import { ResData } from '../../libs/result';
import { expect } from 'chai';
import TagHandler from '../../libs/handlers/03.tag.handler';
import { genTagDay, genTagMonth, genTagYear } from '../../libs/util';

describe('03.tag.handler.ts', function () {
  beforeEach(() => sinon.restore());
  afterEach(() => sinon.restore());

  describe('execute', function () {
    it('should be good', async function () {
      const db = DB.get(DAYONE_DB_PATH);
      const entryId = 12;
      const tagIds = [131, 132];
      const tagNames = { '131': 'AdditionalTag131', '132': 'AdditionalTag132' };
      const year = 2020;
      const month = 9;
      const day = 11;
      sinon.stub(db, 'entryDetailById').callsFake(async function (id: number): Promise<DayoneEntry> {
        expect(id).to.be.equal(entryId);
        return {
          id,
          uuid: 'CC08EAA4F4B144EBBA74E416DCDB0B66',
          year,
          month,
          day,
          locationId: null,
          weatherId: null,
          markdown: ''
        } as DayoneEntry;
      });
      sinon.stub(db, 'entryTagIds').callsFake(async function (id: number): Promise<DayoneTagId[]> {
        expect(id).to.be.equal(entryId);
        return tagIds.map((id) => {
          return { tagId: id } as DayoneTagId;
        });
      });
      sinon.stub(db, 'tagDetail').callsFake(async function (id: number): Promise<DayoneTag> {
        expect(tagIds).to.contain(id);
        return {
          id,
          name: tagNames[id]
        } as DayoneTag;
      });

      const handler = new TagHandler();
      const res = new ResData();
      await handler.execute(entryId, res);

      expect(res).to.have.property('tags');
      expect(res.tags).to.be.an('array');
      const expected = [
        genTagYear(year),
        ...genTagMonth(year, month),
        ...genTagDay(year, month, day),
        ...Object.values(tagNames).map((name) => `#${name}`)
      ];
      expect(res.tags).to.be.eql(expected);

      sinon.restore();
    });
  });
});
