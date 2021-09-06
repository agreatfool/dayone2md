import * as LibFs from 'fs/promises';
import * as LibPath from 'path';
import { Generator } from '../libs/generator';
import { ResData, ResFrontmatter, ResLocation, ResMarkdownImage, ResWeather } from '../libs/result';
import { expect } from 'chai';
import { uuidv4 } from '../libs/util';
import { DAYONE_PHOTO_PATH, POST_ASSETS_DIR_NAME } from '../libs/const';
import { DayoneEntry } from '../libs/models';
import * as sinon from 'sinon';
import { DB } from '../libs/db';
import { Processor } from '../libs/processor';

const mkdirp = require('mkdirp');

const genResMarkdownImage = function (uuid?: string) {
  if (!uuid) {
    uuid = uuidv4();
  }
  return {
    indexInEntry: 0,
    dayoneFileName: `${uuid}_old.jpeg`,
    newFileName: `${uuid}_new.jpeg`,
    attachment: null
  } as ResMarkdownImage;
};

describe('generator.ts', function () {
  beforeEach(() => sinon.restore());
  afterEach(() => sinon.restore());

  describe('_genVaultName', function () {
    it('should be able to generate correct vault name from dest path', function () {
      const generator = new Generator();
      generator['_dest'] = '/Users/Jonathan/some/dir/to/contain/vault/Notes';
      const _genVaultName = generator['_genVaultName'].bind(generator);
      expect(_genVaultName()).to.be.equal('Notes');
    });
  });

  describe('_genGalleryDirName', function () {
    it('should be able to generate correct gallery dir name', function () {
      const generator = new Generator();
      const _genGalleryDirName = generator['_genGalleryDirName'].bind(generator);

      expect(_genGalleryDirName(0)).to.be.equal('gallery00');
      expect(_genGalleryDirName(3)).to.be.equal('gallery03');
      expect(_genGalleryDirName(13)).to.be.equal('gallery13');
    });
  });

  describe('_genPostDir', function () {
    it('should be good to generate post dir', async function () {
      const generator = new Generator();
      generator['_dest'] = '/tmp';
      const _genPostDir = generator['_genPostDir'].bind(generator);

      const res = new ResData();
      res.frontmatter.path = '/2020/09/20200911-test-slug' + uuidv4();
      generator['_result'] = res;

      await _genPostDir();
      expect((await LibFs.stat('/tmp' + res.frontmatter.path)).isDirectory()).to.be.true;
    });
    it('should be good with post contains assets', async function () {
      const generator = new Generator();
      generator['_dest'] = '/tmp';
      const _genPostDir = generator['_genPostDir'].bind(generator);

      const res = new ResData();
      res.markdown.paragraphs.push({ type: 'image', content: null });
      res.frontmatter.path = '/2020/09/20200911-test-slug' + uuidv4();
      generator['_result'] = res;

      await _genPostDir(res);
      expect((await LibFs.stat('/tmp' + res.frontmatter.path + '/' + POST_ASSETS_DIR_NAME)).isDirectory()).to.be.true;
    });
  });

  describe('_genFrontmatter', function () {
    it('should be good to generate the frontmatter string', function () {
      const uuid = uuidv4();
      const generator = new Generator();
      const res = new ResData();
      const fm = new ResFrontmatter();
      fm.uuid = uuid;
      fm.path = '/2020/09/20200911-test-slug';
      fm.date = '2020-09-11';
      fm.slug = 'test-slug';
      fm.title = 'Test Post';
      const location = new ResLocation();
      location.altitude = 1;
      location.latitude = 33.123;
      location.longitude = 123.123;
      location.address = 'address';
      location.placename = 'placename';
      location.district = 'district';
      location.city = 'city';
      location.province = 'province';
      location.country = 'country';
      const weather = new ResWeather();
      weather.temperature = 26;
      weather.humidity = 50;
      weather.weather = 'good';
      weather.time = '22:52:00';
      weather.aqi = 33;
      fm.location = location;
      fm.weather = weather;
      res.frontmatter = fm;
      generator['_result'] = res;

      const _genFrontmatter = generator['_genFrontmatter'].bind(generator);
      expect(_genFrontmatter()).to.be.equal(
        [
          '---',
          `uuid: "${uuid}"`,
          'path: "/2020/09/20200911-test-slug"',
          'date: "2020-09-11"',
          'slug: "test-slug"',
          'title: "Test Post"',
          'location:',
          '  altitude: 1',
          '  latitude: 33.123',
          '  longitude: 123.123',
          '  address: "address"',
          '  placename: "placename"',
          '  district: "district"',
          '  city: "city"',
          '  province: "province"',
          '  country: "country"',
          'weather:',
          '  temperature: 26',
          '  humidity: 50',
          '  weather: "good"',
          '  aqi: 33',
          '---',
          ''
        ].join('\n')
      );
    });
  });

  describe('_genOutputMdImage', function () {
    it('should be able to copy file & generate markdown string', async function () {
      const generator = new Generator();
      const assertsDir = `/tmp/${uuidv4()}`;
      generator['_postAssetsDir'] = assertsDir;
      const image = genResMarkdownImage();

      let source;
      let destination;
      const stub_copyFile = async function (src: string, dest: string): Promise<void> {
        source = src;
        destination = dest;
      };
      generator['_copyFile'] = stub_copyFile.bind(generator);

      const _genOutputMdImage = generator['_genOutputMdImage'].bind(generator);
      expect(await _genOutputMdImage(image)).to.be.equal(`![[${image.newFileName}]]`);
      expect(source).to.be.equal(LibPath.join(DAYONE_PHOTO_PATH, image.dayoneFileName));
      expect(destination).to.be.equal(LibPath.join(assertsDir, image.newFileName));
    });
  });

  describe('_genOutputMdGallery', function () {
    it('should be able to copy file & generate correct gallery strings', async function () {
      const generator = new Generator();
      generator['_vaultName'] = 'Notes';
      const postPath = '/2020/12/20201203-test-slug';
      const res = new ResData();
      res.frontmatter.path = postPath;
      generator['_result'] = res;
      const assertsDir = `/tmp/${uuidv4()}`;
      generator['_postAssetsDir'] = assertsDir;
      const images: ResMarkdownImage[] = [];
      for (let i = 0; i < 5; i++) {
        images.push(genResMarkdownImage());
      }
      const _genGalleryDirName = generator['_genGalleryDirName'].bind(generator);
      const galleryIndex = 11;
      const galleryName = _genGalleryDirName(galleryIndex);

      const copies: { source: string; dest: string }[] = [];
      const stub_copyFile = async function (source: string, dest: string): Promise<void> {
        copies.push({ source, dest });
      };
      generator['_copyFile'] = stub_copyFile.bind(generator);

      const _genOutputMdGallery = generator['_genOutputMdGallery'].bind(generator);
      expect(await _genOutputMdGallery(images, galleryIndex)).to.be.eql([
        '```gallery',
        'type=grid',
        `path=Notes${LibPath.join(postPath, POST_ASSETS_DIR_NAME, galleryName)}`,
        'imgWidth=250',
        'divWidth=100',
        'divAlign=left',
        'reverseOrder=false',
        '```'
      ]);
      expect(copies).to.be.lengthOf(5);
      for (const [index, copy] of copies.entries()) {
        const image = images[index];
        expect(copy.source).to.be.equal(LibPath.join(DAYONE_PHOTO_PATH, image.dayoneFileName));
        expect(copy.dest).to.be.equal(LibPath.join(assertsDir, galleryName, image.newFileName));
      }
      expect((await LibFs.stat(LibPath.join(assertsDir, galleryName))).isDirectory()).to.be.true;
    });
  });

  describe('_genOutputMdPost', function () {
    it('should be able to generate correct outer post link string', async function () {
      const entryUuid = uuidv4();
      const entryId = 123;
      const db = DB.get(`/tmp/${uuidv4()}.sqlite`);
      const genEntry = function (): DayoneEntry {
        return {
          id: entryId,
          uuid: entryUuid,
          year: 2020,
          month: 9,
          day: 11,
          locationId: null,
          weatherId: null,
          markdown: ['# Title of The Post', '', 'some content'].join('\n')
        } as DayoneEntry;
      };
      sinon.stub(db, 'entryDetailByUuid').callsFake(async function (uuid: string): Promise<DayoneEntry> {
        expect(uuid).to.be.equal(entryUuid);
        return genEntry();
      });
      sinon.stub(db, 'entryDetailById').callsFake(async function (id: number): Promise<DayoneEntry> {
        expect(id).to.be.equal(entryId);
        return genEntry();
      });
      Processor.get('/tmp', new Map());

      const generator = new Generator();
      const _genOutputMdPost = generator['_genOutputMdPost'].bind(generator);
      expect(await _genOutputMdPost(entryUuid)).to.be.equal('[Title of The Post](title-of-the-post.md)');
    });
  });

  describe('_genMarkdownFile', function () {
    it('should be good to generate markdown file', async function () {
      const generator = new Generator();
      const postDir = `/tmp/${uuidv4()}`;
      generator['_postDir'] = postDir;
      await mkdirp(postDir);
      const res = new ResData();
      res.frontmatter.slug = 'title-of-the-post';
      generator['_result'] = res;
      const frontmatter = ['---', 'first', 'next', '---', ''].join('\n');
      generator['_frontmatter'] = frontmatter;
      const markdown = ['# Title of the post', '', 'some content'].join('\n');
      generator['_markdown'] = markdown;

      const _genMarkdownFile = generator['_genMarkdownFile'].bind(generator);
      await _genMarkdownFile();
      const mdPath = LibPath.join(postDir, res.frontmatter.slug + '.md');
      expect((await LibFs.stat(mdPath)).isFile());
      expect((await LibFs.readFile(mdPath)).toString()).to.be.equal(frontmatter + '\n' + markdown);
    });
  });
});
