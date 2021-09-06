import * as sinon from 'sinon';
import { expect } from 'chai';
import { DB } from '../../libs/db';
import { DayoneAttachment, DayoneEntry } from '../../libs/models';
import MarkdownHandler from '../../libs/handlers/90.markdown.handler';
import { ResData, ResMarkdown, ResMarkdownImage, ResMarkdownParagraph } from '../../libs/result';
import { convertDayoneAttachment2ResMarkdownImage, uuidv4 } from '../../libs/util';

const initHandler = function (options?: { rows?: string[]; mapping?: { [key: string]: string } }): MarkdownHandler {
  const handler = new MarkdownHandler();
  handler['_result'] = new ResData();
  handler['_markdown'] = new ResMarkdown();
  handler['_postUuid'] = uuidv4();

  if (options && options.rows) {
    handler['_rows'] = options.rows;
  } else {
    handler['_rows'] = [];
  }

  if (options && options.mapping) {
    handler['_mapping'] = new Map<string, string>();
    for (const [key, value] of Object.entries(options.mapping)) {
      handler['_mapping'].set(key, value);
    }
  } else {
    handler['_mapping'] = new Map<string, string>();
  }

  return handler;
};
const stubDbAttachment = function () {
  sinon.stub(DB.get(`/tmp/${uuidv4()}.sqlite`), 'attachmentDetail').callsFake(async function (uuid: string): Promise<DayoneAttachment> {
    return genDayoneAttachment(uuid);
  });
};
const genDayoneAttachment = function (uuid: string): DayoneAttachment {
  return {
    id: 1,
    entryId: 1,
    uuid: uuid,
    filename: uuid,
    filetype: 'jpeg'
  } as DayoneAttachment;
};
const genResMarkdownImage = function (postUuid: string, markdown: ResMarkdown, uuid?: string): ResMarkdownImage {
  if (!uuid) {
    uuid = uuidv4();
  }
  return convertDayoneAttachment2ResMarkdownImage(genDayoneAttachment(uuid), postUuid, markdown);
};

describe('90.markdown.handler.ts', function () {
  beforeEach(() => sinon.restore());
  afterEach(() => sinon.restore());

  describe('_splitMdRows', function () {
    it('should be able to split markdown into rows', function () {
      const handler = initHandler();
      const _splitMdRows = handler['_splitMdRows'].bind(handler);

      const markdown = `
        This is the first line
        This is the second line
        This is the line with \rsome \r\ndata
      `;
      expect(_splitMdRows(markdown)).to.be.eql([
        '',
        'This is the first line',
        'This is the second line',
        'This is the line with',
        'some',
        'data',
        ''
      ]);
    });
  });

  describe('_fetchTitle', function () {
    it('should be good to get the title from rows', async function () {
      const handler = initHandler();
      const _fetchTitle = handler['_fetchTitle'].bind(handler);
      const _splitMdRows = handler['_splitMdRows'].bind(handler);

      const markdown = `
        ![](dayone-moment://9A2D00938E4C4967920ED8C83C3060AB)
        
        [some post before](dayone2://view?entryId=D897D4DB03744BA5BF7DB96B59246574)
        
        ## this is the-h2\\-title
        
        Some content begin\\s here
      `;
      handler['_rows'] = _splitMdRows(markdown);

      const title = _fetchTitle();
      expect(title).to.be.equal('this is the-h2-title');
      expect(handler['_rows']).to.be.eql([
        '',
        '![](dayone-moment://9A2D00938E4C4967920ED8C83C3060AB)',
        '',
        '[some post before](dayone2://view?entryId=D897D4DB03744BA5BF7DB96B59246574)',
        '',
        `# ${title}`,
        '',
        'Some content begins here',
        ''
      ]);
    });
    it('should be good to get the first content as the title', async function () {
      const handler = initHandler();
      const _fetchTitle = handler['_fetchTitle'].bind(handler);
      const _splitMdRows = handler['_splitMdRows'].bind(handler);

      const markdown = `
        ![](dayone-moment://9A2D00938E4C4967920ED8C83C3060AB)
        
        [some post before](dayone2://view?entryId=D897D4DB03744BA5BF7DB96B59246574)
        
        row content as title
        
        Some content begin\\s here
      `;
      handler['_rows'] = _splitMdRows(markdown);

      const title = _fetchTitle();
      expect(title).to.be.equal('row content as title');
      expect(handler['_rows']).to.be.eql([
        '',
        '![](dayone-moment://9A2D00938E4C4967920ED8C83C3060AB)',
        '',
        '[some post before](dayone2://view?entryId=D897D4DB03744BA5BF7DB96B59246574)',
        '',
        `# ${title}`,
        '',
        'Some content begins here',
        ''
      ]);
    });
  });

  describe('_genSlugFromTitle', function () {
    it('should be good with non-chinese cases', function () {
      const handler = initHandler();
      const _genSlugFromTitle = handler['_genSlugFromTitle'].bind(handler);
      expect(_genSlugFromTitle('Abc  123 gOOd')).to.be.equal('abc-123-good');
    });
    it('should be good with chinese cases', function () {
      const handler = initHandler({
        mapping: {
          测试t1: 'test-slug-1',
          '测试T 2': 'test-slug-2',
          '测试-3': 'test-slug-3'
        }
      });
      const _genSlugFromTitle = handler['_genSlugFromTitle'].bind(handler);
      expect(_genSlugFromTitle('测试t1')).to.be.equal('test-slug-1');
      expect(_genSlugFromTitle('测试T 2')).to.be.equal('test-slug-2');
      expect(_genSlugFromTitle('测试-3')).to.be.equal('test-slug-3');
    });
    it('should be good with missing chinese title', function () {
      const handler = initHandler({
        mapping: {
          测试1: 'test-slug-1',
          '测试 2': 'test-slug-2',
          '测试-3': 'test-slug-3'
        }
      });
      const _genSlugFromTitle = handler['_genSlugFromTitle'].bind(handler);
      expect(_genSlugFromTitle('测试 Missing 1')).to.be.equal('测试-missing-1');
      expect(_genSlugFromTitle('测试  mISsing-2')).to.be.equal('测试-missing-2');
    });
  });

  describe('_saveMarkdownParagraph', function () {
    it('should be good to save paragraph', function () {
      const handler = initHandler();
      const markdown = handler['_markdown'];

      expect(markdown.paragraphs).to.be.eql([]);
      const _saveMarkdownParagraph = handler['_saveMarkdownParagraph'].bind(handler);

      _saveMarkdownParagraph('paragraph', '123');
      expect(markdown.paragraphs).to.have.lengthOf(1);
      expect(markdown.paragraphs[0]).to.be.eql({ type: 'paragraph', content: '123' });

      _saveMarkdownParagraph('cover', null);
      expect(markdown.paragraphs).to.have.lengthOf(2);
      expect(markdown.paragraphs[1]).to.be.eql({ type: 'cover', content: null });
    });
  });

  describe('_handleGalleryPost', function () {
    it('should be good to convert gallery post', function () {
      const handler = initHandler();
      const postUuid = handler['_postUuid'];
      const markdown = handler['_markdown'];
      const cover1 = genResMarkdownImage(postUuid, markdown);
      const cover2 = genResMarkdownImage(postUuid, markdown);
      const cover3 = genResMarkdownImage(postUuid, markdown);
      markdown.paragraphs = [
        { type: 'paragraph', content: '' },
        { type: 'cover', content: cover1 },
        { type: 'paragraph', content: '' },
        { type: 'cover', content: cover2 },
        { type: 'paragraph', content: '' },
        { type: 'cover', content: cover3 },
        { type: 'paragraph', content: '' }
      ];
      const _handleGalleryPost = handler['_handleGalleryPost'].bind(handler);
      _handleGalleryPost();

      expect(markdown.paragraphs).to.be.eql([{ type: 'gallery', content: [cover1, cover2, cover3] }]);
    });
  });

  describe('_handleSingleImageGallery', function () {
    it('should be good to convert single image gallery', function () {
      const handler = initHandler();
      const gallery1Img1 = genResMarkdownImage(handler['_postUuid'], handler['_markdown']);
      handler['_markdown'].paragraphs.push(...([{ type: 'gallery', content: [gallery1Img1] }] as ResMarkdownParagraph[]));
      const _handleSingleImageGallery = handler['_handleSingleImageGallery'].bind(handler);
      _handleSingleImageGallery();

      expect(handler['_markdown'].paragraphs).to.be.eql([{ type: 'image', content: gallery1Img1 }]);
    });
  });

  describe('_handleCoverPhaseRow', function () {
    it('should end the cover phase even empty row', function () {
      // this case shall not happen, since empty row would be handled in "_handleMarkdownRow"
      const handler = initHandler();
      const _handleCoverPhaseRow = handler['_handleCoverPhaseRow'].bind(handler);
      _handleCoverPhaseRow('');
      expect(handler['_markdown'].isCoverPhaseDone).to.be.true;
    });
    it('should be good to parse and end the cover phase', async function () {
      stubDbAttachment();
      const handler = initHandler();
      const postUuid = handler['_postUuid'];
      const stub_handleNormalPhaseRow = async function (row: string): Promise<void> {
        this._markdown.paragraphs.push({
          type: 'paragraph',
          content: row
        } as ResMarkdownParagraph);
      };
      handler['_handleNormalPhaseRow'] = stub_handleNormalPhaseRow.bind(handler);
      const _handleCoverPhaseRow = handler['_handleCoverPhaseRow'].bind(handler);

      const md = new ResMarkdown();
      const cover1 = genResMarkdownImage(postUuid, md);
      const cover2 = genResMarkdownImage(postUuid, md);
      const cover3 = genResMarkdownImage(postUuid, md);

      await _handleCoverPhaseRow(`![](dayone-moment://${cover1.attachment.uuid})`);
      expect(handler['_markdown'].isCoverPhaseDone).to.be.false;
      await _handleCoverPhaseRow(`![](dayone-moment://${cover2.attachment.uuid})`);
      expect(handler['_markdown'].isCoverPhaseDone).to.be.false;
      await _handleCoverPhaseRow(`![](dayone-moment://${cover3.attachment.uuid})`);
      expect(handler['_markdown'].isCoverPhaseDone).to.be.false;
      await _handleCoverPhaseRow('some normal post content');
      expect(handler['_markdown'].isCoverPhaseDone).to.be.true;
      expect(handler['_markdown'].paragraphs).to.be.eql([
        { type: 'cover', content: cover1 },
        { type: 'cover', content: cover2 },
        { type: 'cover', content: cover3 },
        { type: 'paragraph', content: 'some normal post content' }
      ]);
    });
  });

  describe('_handleNormalPhaseRow', function () {
    it('should be able to select correct handling function', async function () {
      let normalCalled = false;
      let imageCalled = false;
      let postCalled = false;
      const resetCalledFlag = () => {
        normalCalled = false;
        imageCalled = false;
        postCalled = false;
      };

      const handler = initHandler();
      const _handleNormalPhaseRow = handler['_handleNormalPhaseRow'].bind(handler);
      const stub_handleNormalRow = function () {
        normalCalled = true;
      };
      handler['_handleNormalRow'] = stub_handleNormalRow.bind(handler);
      const stub_handlePostRow = function () {
        postCalled = true;
      };
      handler['_handlePostRow'] = stub_handlePostRow.bind(handler);
      const stub_handleGalleryRow = function () {
        imageCalled = true;
      };
      handler['_handleGalleryRow'] = stub_handleGalleryRow.bind(handler);

      resetCalledFlag();
      await _handleNormalPhaseRow('normal content');
      expect(normalCalled).to.be.true;

      resetCalledFlag();
      await _handleNormalPhaseRow(`![](dayone-moment://${uuidv4()})`);
      expect(imageCalled).to.be.true;

      resetCalledFlag();
      await _handleNormalPhaseRow(`[Some post title](dayone2://view?entryId=${uuidv4()})`);
      expect(postCalled).to.be.true;
    });
  });

  describe('_handleNormalRow', function () {
    it('should be able to add normal paragraphs', function () {
      const handler = initHandler();
      const markdown = handler['_markdown'];
      const _handleNormalRow = handler['_handleNormalRow'].bind(handler);

      _handleNormalRow('some content1');
      expect(markdown.isInGalleryPhase).to.be.false;
      expect(markdown.paragraphs).to.have.lengthOf(1);
      expect(markdown.paragraphs[0]).to.be.eql({ type: 'paragraph', content: 'some content1' });

      markdown.isInGalleryPhase = true;
      _handleNormalRow('some content2');
      expect(markdown.isInGalleryPhase).to.be.false;
      expect(markdown.paragraphs).to.have.lengthOf(2);
      expect(markdown.paragraphs[1]).to.be.eql({ type: 'paragraph', content: 'some content2' });
    });
  });

  describe('_handlePostRow', function () {
    it('should be able to add post paragraphs', function () {
      const handler = initHandler();
      const markdown = handler['_markdown'];
      const _handlePostRow = handler['_handlePostRow'].bind(handler);

      const post1Uuid = uuidv4();
      const post2Uuid = uuidv4();

      _handlePostRow(post1Uuid);
      expect(markdown.isInGalleryPhase).to.be.false;
      expect(markdown.paragraphs).to.have.lengthOf(1);
      expect(markdown.paragraphs[0]).to.be.eql({ type: 'post', content: { postUuid: post1Uuid } });

      markdown.isInGalleryPhase = true;
      _handlePostRow(post2Uuid);
      expect(markdown.isInGalleryPhase).to.be.false;
      expect(markdown.paragraphs).to.have.lengthOf(2);
      expect(markdown.paragraphs[1]).to.be.eql({ type: 'post', content: { postUuid: post2Uuid } });
    });
  });

  describe('_handleGalleryRow', function () {
    it('should be able to work as expected', async function () {
      stubDbAttachment();
      const handler = initHandler();
      const postUuid = handler['_postUuid'];
      const existingParagraphs: ResMarkdownParagraph[] = [
        { type: 'cover', content: null },
        { type: 'paragraph', content: 'title' },
        { type: 'paragraph', content: '' },
        { type: 'paragraph', content: 'some content1' },
        { type: 'paragraph', content: '' },
        { type: 'paragraph', content: 'some content2' }
      ];
      const md = new ResMarkdown();
      const gallery1Img1 = genResMarkdownImage(postUuid, md);
      const gallery1Img2 = genResMarkdownImage(postUuid, md);
      const gallery1Img3 = genResMarkdownImage(postUuid, md);
      const gallery2Img1 = genResMarkdownImage(postUuid, md);
      const gallery2Img2 = genResMarkdownImage(postUuid, md);

      const _handleGalleryRow = handler['_handleGalleryRow'].bind(handler);
      const _handleNormalRow = handler['_handleNormalRow'].bind(handler);
      const markdown = handler['_markdown'];
      markdown.paragraphs = [].concat(existingParagraphs);
      markdown.isCoverPhaseDone = true;

      // first gallery first image
      expect(markdown.isInGalleryPhase).to.be.false;
      await _handleGalleryRow(gallery1Img1.attachment.uuid);
      expect(markdown.isInGalleryPhase).to.be.true;
      const lastParagraph = markdown.paragraphs[markdown.paragraphs.length - 1];
      expect(lastParagraph.type).to.be.equal('gallery');
      expect(lastParagraph.content).to.be.an('array');
      expect(lastParagraph.content).to.have.lengthOf(1);
      expect(lastParagraph.content).to.be.eql([gallery1Img1]);

      // some empty rows
      markdown.paragraphs.push({ type: 'paragraph', content: '' });
      markdown.paragraphs.push({ type: 'paragraph', content: '' });

      // first gallery, the remaining ones
      await _handleGalleryRow(gallery1Img2.attachment.uuid);
      markdown.paragraphs.push({ type: 'paragraph', content: '' });
      await _handleGalleryRow(gallery1Img3.attachment.uuid);
      markdown.paragraphs.push({ type: 'paragraph', content: '' });

      // some content to terminate the first gallery
      _handleNormalRow('some content others');
      markdown.paragraphs.push({ type: 'paragraph', content: '' });
      expect(markdown.isInGalleryPhase).to.be.false;

      // second gallery
      await _handleGalleryRow(gallery2Img1.attachment.uuid);
      await _handleGalleryRow(gallery2Img2.attachment.uuid);

      // final check
      expect(markdown.isInGalleryPhase).to.be.true;
      expect(markdown.paragraphs).to.be.eql(
        existingParagraphs.concat([
          { type: 'gallery', content: [gallery1Img1, gallery1Img2, gallery1Img3] },
          { type: 'paragraph', content: '' },
          { type: 'paragraph', content: '' },
          { type: 'paragraph', content: '' },
          { type: 'paragraph', content: '' },
          { type: 'paragraph', content: 'some content others' },
          { type: 'paragraph', content: '' },
          { type: 'gallery', content: [gallery2Img1, gallery2Img2] }
        ] as ResMarkdownParagraph[])
      );
    });
  });

  describe('_loopAllMarkdownRows', function () {
    // "_handleMarkdownRow" would be tested in this case
    it('should be able to work with non pure gallery post', async function () {
      stubDbAttachment();
      const handler = initHandler();
      const postUuid = handler['_postUuid'];
      const _loopAllMarkdownRows = handler['_loopAllMarkdownRows'].bind(handler);

      const md = new ResMarkdown();
      const cover1 = genResMarkdownImage(postUuid, md);
      const cover2 = genResMarkdownImage(postUuid, md);
      const gallery1Img1 = genResMarkdownImage(postUuid, md);
      const gallery1Img2 = genResMarkdownImage(postUuid, md);
      const gallery1Img3 = genResMarkdownImage(postUuid, md);
      const gallery2Img1 = genResMarkdownImage(postUuid, md);
      const gallery2Img2 = genResMarkdownImage(postUuid, md);
      const postUuid1 = uuidv4();
      const postUuid2 = uuidv4();
      const gallery3Img1 = genResMarkdownImage(postUuid, md);

      handler['_rows'] = [
        `![](dayone-moment://${cover1.attachment.uuid})`,
        '',
        `![](dayone-moment://${cover2.attachment.uuid})`,
        '',
        'title',
        '',
        'first line content',
        '',
        '# gallery1',
        `![](dayone-moment://${gallery1Img1.attachment.uuid})`,
        '',
        `![](dayone-moment://${gallery1Img2.attachment.uuid})`,
        '',
        `![](dayone-moment://${gallery1Img3.attachment.uuid})`,
        '',
        'some content',
        '',
        '# gallery2',
        `![](dayone-moment://${gallery2Img1.attachment.uuid})`,
        '',
        `![](dayone-moment://${gallery2Img2.attachment.uuid})`,
        '',
        '# out posts',
        `[out post1](dayone2://view?entryId=${postUuid1})`,
        '',
        `[out post1](dayone2://view?entryId=${postUuid2})`,
        '',
        '# gallery3',
        `![](dayone-moment://${gallery3Img1.attachment.uuid})`,
        ''
      ];
      await _loopAllMarkdownRows();

      expect(handler['_markdown'].paragraphs).to.be.eql([
        { type: 'cover', content: cover1 },
        { type: 'paragraph', content: '' },
        { type: 'cover', content: cover2 },
        { type: 'paragraph', content: '' },
        { type: 'paragraph', content: 'title' },
        { type: 'paragraph', content: '' },
        { type: 'paragraph', content: 'first line content' },
        { type: 'paragraph', content: '' },
        { type: 'paragraph', content: '# gallery1' },
        { type: 'gallery', content: [gallery1Img1, gallery1Img2, gallery1Img3] },
        { type: 'paragraph', content: 'some content' },
        { type: 'paragraph', content: '' },
        { type: 'paragraph', content: '# gallery2' },
        { type: 'gallery', content: [gallery2Img1, gallery2Img2] },
        { type: 'paragraph', content: '# out posts' },
        { type: 'post', content: { postUuid: postUuid1 } },
        { type: 'paragraph', content: '' },
        { type: 'post', content: { postUuid: postUuid2 } },
        { type: 'paragraph', content: '' },
        { type: 'paragraph', content: '# gallery3' },
        { type: 'image', content: gallery3Img1 }
      ]);
    });
    it('should be able to work with pure gallery post', async function () {
      stubDbAttachment();
      const handler = initHandler();
      const postUuid = handler['_postUuid'];
      const _loopAllMarkdownRows = handler['_loopAllMarkdownRows'].bind(handler);

      const md = new ResMarkdown();
      const gallery1Img1 = genResMarkdownImage(postUuid, md);
      const gallery1Img2 = genResMarkdownImage(postUuid, md);
      const gallery1Img3 = genResMarkdownImage(postUuid, md);
      const gallery1Img4 = genResMarkdownImage(postUuid, md);
      const gallery1Img5 = genResMarkdownImage(postUuid, md);

      handler['_rows'] = [
        `![](dayone-moment://${gallery1Img1.attachment.uuid})`,
        '',
        `![](dayone-moment://${gallery1Img2.attachment.uuid})`,
        '',
        `![](dayone-moment://${gallery1Img3.attachment.uuid})`,
        '',
        `![](dayone-moment://${gallery1Img4.attachment.uuid})`,
        '',
        `![](dayone-moment://${gallery1Img5.attachment.uuid})`,
        ''
      ];
      await _loopAllMarkdownRows();

      expect(handler['_markdown'].paragraphs).to.be.eql([
        { type: 'gallery', content: [gallery1Img1, gallery1Img2, gallery1Img3, gallery1Img4, gallery1Img5] }
      ]);
    });
  });
});
