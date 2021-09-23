import { expect } from 'chai';
import { Processor } from '../libs/processor';
import LocationHandler from '../libs/handlers/01.location.handler';
import WeatherHandler from '../libs/handlers/02.weather.handler';
import TagHandler from '../libs/handlers/03.tag.handler';
import MarkdownHandler from '../libs/handlers/90.markdown.handler';
import FrontmatterHandler from '../libs/handlers/99.frontmatter.handler';
import { Handler } from '../libs/handler';

describe('processor.ts', function () {
  describe('static instance', function () {
    it('should be able to generate static instance', function () {
      Processor['_instance'] = undefined; // reset
      const instance = Processor.get('/tmp', new Map());
      expect(instance).to.be.instanceOf(Processor);
      expect(instance).to.have.property('_dest', '/tmp');
      expect(instance).to.have.property('_mapping');
      expect(instance['_mapping']).to.be.eql(new Map());
      expect(Processor['_instance']).to.be.instanceOf(Processor);
      expect(Processor.get()).to.be.instanceOf(Processor);
    });
  });

  describe('_loadHandlers', function () {
    it('should be able to load handlers', async function () {
      const processor = new Processor('/tmp', new Map());
      const _loadHandlers = processor['_loadHandlers'].bind(processor);
      await _loadHandlers();
      const _handlers = processor['_handlers'];
      expect(_handlers).to.be.an('array');
      expect(_handlers).to.have.lengthOf(5);

      const expectedInstances = [LocationHandler, WeatherHandler, TagHandler, MarkdownHandler, FrontmatterHandler];
      for (const handler of _handlers) {
        const instance = expectedInstances.shift();
        expect(handler).to.be.instanceOf(instance);
        expect(handler).to.be.instanceOf(Handler);
      }
    });
  });
});
