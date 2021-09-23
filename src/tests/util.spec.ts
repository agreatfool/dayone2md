import * as LibFs from 'fs';
import { v4 } from 'uuid';
import { expect } from 'chai';
import {
  convertDayoneAttachment2ResMarkdownImage,
  genDateStr,
  genPostDirStr,
  genTagDay,
  genTagMonth,
  genTagStr,
  genTagYear,
  isStringContainsCn,
  isStringDayoneImage,
  isStringDayonePost,
  loadPostTitleSlugMappingJson,
  padNumLeft0,
  removeDayoneRowTitleMark,
  removeIndexFromArr,
  trimDayoneRow,
  uuidv4
} from '../libs/util';
import { DayoneAttachment } from '../libs/models';
import { ResMarkdown } from '../libs/result';

describe('util.ts', function () {
  describe('padNumLeft0', function () {
    it('should be good with 0 4', function () {
      expect(padNumLeft0(0, 4)).to.be.equal('0000');
    });
    it('should be good with 11 4', function () {
      expect(padNumLeft0(11, 4)).to.be.equal('0011');
    });
    it('should be good with 1234 4', function () {
      expect(padNumLeft0(1234, 4)).to.be.equal('1234');
    });
  });

  describe('genTagStr', function () {
    it('should be good with tagName', function () {
      expect(genTagStr('tagName')).to.be.equal('#tagName');
    });
  });

  describe('genTagYear', function () {
    it('should be good with 2021', function () {
      expect(genTagYear(2021)).to.be.equal('#Y2021');
    });
  });

  describe('genTagMonth', function () {
    it('should be good with 2021 09', function () {
      expect(genTagMonth(2021, 9)).to.be.eql(['#M202109', '#M09']);
    });
    it('should be good with 2020 11', function () {
      expect(genTagMonth(2020, 11)).to.be.eql(['#M202011', '#M11']);
    });
  });

  describe('genTagDay', function () {
    it('should be good with 2021 9 1', function () {
      expect(genTagDay(2021, 9, 1)).to.be.eql(['#D20210901', '#D0901']);
    });
    it('should be good with 2020 9 11', function () {
      expect(genTagDay(2020, 9, 11)).to.be.eql(['#D20200911', '#D0911']);
    });
    it('should be good with 2020 12 11', function () {
      expect(genTagDay(2020, 12, 11)).to.be.eql(['#D20201211', '#D1211']);
    });
  });

  describe('genDateStr', function () {
    it('should be good with 2021 9 11', function () {
      expect(genDateStr(2021, 9, 11)).to.be.equal('2021-09-11');
    });
  });

  describe('genPostDirStr', function () {
    it('should be good with 2021 9 11 slug-name', function () {
      expect(genPostDirStr(2021, 9, 11, 'slug-name')).to.be.equal('/2021/09/20210911-slug-name');
    });
  });

  describe('uuidv4', function () {
    it('should be good uuid str', function () {
      const uuid = uuidv4();
      expect(uuid).to.be.lengthOf(32);
      const matched = uuid.match(/[A-Z0-9]{32}/g);
      expect(matched).to.be.an('array');
      expect(matched).to.be.lengthOf(1);
      expect(matched[0]).to.be.equal(uuid);
    });
  });

  describe('loadPostTitleSlugMappingJson', function () {
    it('should be good with undefined', function () {
      expect(loadPostTitleSlugMappingJson(undefined)).to.be.eql(new Map());
    });
    it('should be good with empty string', function () {
      expect(loadPostTitleSlugMappingJson('')).to.be.eql(new Map());
    });
    it('should be good with dir', function () {
      expect(loadPostTitleSlugMappingJson('/tmp')).to.be.eql(new Map());
    });
    it('should be good with non-json file', async function () {
      const path = `/tmp/${v4()}.json`;
      await LibFs.promises.writeFile(path, '');
      expect(loadPostTitleSlugMappingJson(path)).to.be.eql(new Map());
    });
    it('should be good with json file', async function () {
      const data = {
        a: '1',
        b: '2',
        c: '3'
      };
      const path = `/tmp/${v4()}.json`;
      await LibFs.promises.writeFile(path, JSON.stringify(data));
      const expected = new Map();
      expected.set('a', '1').set('b', '2').set('c', '3');
      expect(loadPostTitleSlugMappingJson(path)).to.be.eql(expected);
    });
  });

  describe('isStringDayoneImage', function () {
    it('should get image uuid', function () {
      expect(isStringDayoneImage('![](dayone-moment://9A2D00938E4C4967920ED8C83C3060AB)')).to.be.equal('9A2D00938E4C4967920ED8C83C3060AB');
    });
    it('should get null', function () {
      // length issue
      expect(isStringDayoneImage('![](dayone-moment://38E4C4967920ED8C83C3060AB)')).to.be.equal(null);
      // character issue
      expect(isStringDayoneImage('![](dayone-moment://9A2D00938e4C4967920ED8C83C3060AB)')).to.be.equal(null);
      // pattern issue
      expect(isStringDayoneImage('[](dayone-moment://9A2D00938e4C4967920ED8C83C3060AB)')).to.be.equal(null);
    });
  });

  describe('isStringDayonePost', function () {
    it('should get post uuid', function () {
      expect(isStringDayonePost('[post title](dayone2://view?entryId=D897D4DB03744BA5BF7DB96B59246574)')).to.be.equal(
        'D897D4DB03744BA5BF7DB96B59246574'
      );
    });
    it('should get null', function () {
      // length issue
      expect(isStringDayonePost('[post title](dayone2://view?entryId=D897D4DB037B96B59246574)')).to.be.equal(null);
      // character issue
      expect(isStringDayonePost('[post title](dayone2://view?entryId=D897D4Db03744bA5BF7DB96B59246574)')).to.be.equal(null);
      // pattern issue
      expect(isStringDayonePost('[post title](dayone://view?entryId=D897D4DB03744BA5BF7DB96B59246574)')).to.be.equal(null);
    });
  });

  describe('trimDayoneRow', function () {
    it('should be able to remove leading & tailing white spaces', function () {
      expect(trimDayoneRow('  TEXT  ')).to.be.equal('TEXT');
    });
    it('should be able to remove slash in the string', function () {
      expect(trimDayoneRow('#2020\\-08\\-12')).to.be.equal('#2020-08-12');
    });
    it('should keep row break in the string', function () {
      expect(trimDayoneRow('First line\nNext line')).to.be.equal('First line\nNext line');
    });
  });

  describe('removeDayoneRowTitleMark', function () {
    it('should be able to remove title marks', function () {
      expect(removeDayoneRowTitleMark('# title1')).to.be.equal('title1');
      expect(removeDayoneRowTitleMark('## title2')).to.be.equal('title2');
      expect(removeDayoneRowTitleMark('###title3')).to.be.equal('title3');
      expect(removeDayoneRowTitleMark('####title4')).to.be.equal('title4');
      expect(removeDayoneRowTitleMark('##### title5')).to.be.equal('title5');
    });
    it('should keep title mark in the string unchanged', function () {
      expect(removeDayoneRowTitleMark('string1#string2')).to.be.equal('string1#string2');
    });
  });

  describe('removeIndexFromArr', function () {
    it('should be able to remove the index of the array', function () {
      const arr = ['a', 'b', 'c', 'd', 'e'];
      const expected = ['a', 'c', 'd', 'e'];
      removeIndexFromArr(arr, 1);
      expect(arr).to.be.eql(expected);
    });
  });

  describe('isStringContainsCn', function () {
    it('should be able to get false when non-chinese', function () {
      expect(isStringContainsCn('abc123')).to.be.false;
    });
    it('should be able to get true when chinese', function () {
      expect(isStringContainsCn('中文abc123')).to.be.true;
    });
  });

  describe('convertDayoneAttachment2ResMarkdownImage', function () {
    it('should be good to be converted', function () {
      const postUuid = uuidv4();
      const markdown = new ResMarkdown();
      const genAttachment = (id: number) => {
        return {
          id,
          entryId: 1,
          uuid: uuidv4(),
          filename: `test_attachment_${id}`,
          filetype: 'jpeg'
        } as DayoneAttachment;
      };

      const attachment1 = genAttachment(1);
      const attachment2 = genAttachment(2);
      const attachment3 = genAttachment(3);

      expect(convertDayoneAttachment2ResMarkdownImage(attachment1, postUuid, markdown)).to.be.eql({
        indexInEntry: 0,
        dayoneFileName: 'test_attachment_1.jpeg',
        newFileName: `${postUuid}_0000.jpeg`,
        attachment: attachment1
      });
      expect(markdown.imageCounter).to.be.equal(1);

      expect(convertDayoneAttachment2ResMarkdownImage(attachment2, postUuid, markdown)).to.be.eql({
        indexInEntry: 1,
        dayoneFileName: 'test_attachment_2.jpeg',
        newFileName: `${postUuid}_0001.jpeg`,
        attachment: attachment2
      });
      expect(markdown.imageCounter).to.be.equal(2);

      expect(convertDayoneAttachment2ResMarkdownImage(attachment3, postUuid, markdown)).to.be.eql({
        indexInEntry: 2,
        dayoneFileName: 'test_attachment_3.jpeg',
        newFileName: `${postUuid}_0002.jpeg`,
        attachment: attachment3
      });
      expect(markdown.imageCounter).to.be.equal(3);
    });
  });
});
