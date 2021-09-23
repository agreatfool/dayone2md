import { expect } from 'chai';
import { ResData, ResFrontmatter, ResLocation, ResMarkdown, ResWeather } from '../libs/result';

describe('result.ts', function () {
  describe('ResWeather', function () {
    it('should generate default values', function () {
      const instance = new ResWeather();
      expect(instance).to.be.eql({
        temperature: null,
        humidity: null,
        weather: null,
        time: null,
        aqi: null
      });
    });
  });

  describe('ResLocation', function () {
    it('should generate default values', function () {
      const instance = new ResLocation();
      expect(instance).to.be.eql({
        altitude: null,
        latitude: null,
        longitude: null,
        address: null,
        placename: null,
        district: null,
        city: null,
        province: null,
        country: null
      });
    });
  });

  describe('ResFrontmatter', function () {
    it('should generate default values', function () {
      const instance = new ResFrontmatter();
      expect(instance).to.have.property('uuid');
      expect(instance.uuid).to.be.an('string');
      expect(instance).to.be.eql({
        uuid: instance.uuid,
        path: '',
        slug: '',
        date: '',
        title: '',
        location: new ResLocation(),
        weather: new ResWeather()
      });
    });
  });

  describe('ResMarkdown', function () {
    it('should generate default values', function () {
      const instance = new ResMarkdown();
      expect(instance).to.have.property('paragraphs');
      expect(instance.paragraphs).to.be.eql([]);
    });
  });

  describe('ResData', function () {
    it('should gnerate default values', function () {
      const instance = new ResData();
      expect(instance).to.have.property('frontmatter');
      expect(instance.frontmatter).to.be.instanceOf(ResFrontmatter);
      expect(instance).to.be.eql({
        location: new ResLocation(),
        weather: new ResWeather(),
        tags: [],
        frontmatter: instance.frontmatter,
        markdown: new ResMarkdown()
      });
    });
  });
});
