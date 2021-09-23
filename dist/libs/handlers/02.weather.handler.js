"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const handler_1 = require("../handler");
const result_1 = require("../result");
const db_1 = require("../db");
const dayjs = require("dayjs");
const const_1 = require("../const");
class WeatherHandler extends handler_1.Handler {
    execute(entryId, result) {
        return __awaiter(this, void 0, void 0, function* () {
            const entry = yield db_1.DB.get().entryDetailById(entryId);
            const weatherId = entry.weatherId;
            if (!weatherId) {
                // no weather data in this entry, skip
                return;
            }
            const weather = yield db_1.DB.get().weatherDetail(weatherId);
            const weatherRes = new result_1.ResWeather();
            weatherRes.temperature = weather.temperature;
            weatherRes.humidity = weather.humidity;
            weatherRes.weather = weather.weather;
            weatherRes.time = this._formatCreatedTime(entry);
            weatherRes.aqi = null;
            result.weather = weatherRes;
        });
    }
    _formatCreatedTime(entry) {
        return dayjs.unix(entry.createdTime).add(const_1.DAYONE_TIMESTAMP_GAP, 'year').subtract(1, 'hour').format('HH:mm:ss');
    }
}
exports.default = WeatherHandler;
//# sourceMappingURL=02.weather.handler.js.map