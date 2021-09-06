"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResData = exports.ResMarkdown = exports.ResFrontmatter = exports.ResLocation = exports.ResWeather = void 0;
const util_1 = require("./util");
class ResWeather {
    constructor() {
        this.temperature = null;
        this.humidity = null;
        this.weather = null;
        this.time = null;
        this.aqi = null;
    }
}
exports.ResWeather = ResWeather;
class ResLocation {
    constructor() {
        this.altitude = null;
        this.latitude = null;
        this.longitude = null;
        this.address = null;
        this.placename = null;
        this.district = null;
        this.city = null;
        this.province = null;
        this.country = null;
    }
}
exports.ResLocation = ResLocation;
class ResFrontmatter {
    constructor() {
        this.uuid = util_1.uuidv4();
        this.path = '';
        this.date = '';
        this.slug = '';
        this.title = '';
        this.location = new ResLocation();
        this.weather = new ResWeather();
    }
}
exports.ResFrontmatter = ResFrontmatter;
class ResMarkdown {
    constructor() {
        this.imageCounter = 0; // +1 once an image added into paragraphs
        this.isCoverPhaseDone = false;
        this.isInGalleryPhase = false;
        this.paragraphs = [];
    }
}
exports.ResMarkdown = ResMarkdown;
class ResData {
    constructor() {
        this.location = new ResLocation();
        this.weather = new ResWeather();
        this.tags = [];
        this.frontmatter = new ResFrontmatter();
        this.markdown = new ResMarkdown();
    }
}
exports.ResData = ResData;
//# sourceMappingURL=result.js.map