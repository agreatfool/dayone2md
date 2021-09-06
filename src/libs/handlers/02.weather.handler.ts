import { Handler } from '../handler';
import { ResData, ResWeather } from '../result';
import { DB } from '../db';
import { DayoneEntry } from '../models';
import * as dayjs from 'dayjs';
import { DAYONE_TIMESTAMP_GAP } from '../const';

export default class WeatherHandler extends Handler {
  public async execute(entryId: number, result: ResData): Promise<void> {
    const entry = await DB.get().entryDetailById(entryId);
    const weatherId = entry.weatherId;
    if (!weatherId) {
      // no weather data in this entry, skip
      return;
    }

    const weather = await DB.get().weatherDetail(weatherId);

    const weatherRes = new ResWeather();
    weatherRes.temperature = weather.temperature;
    weatherRes.humidity = weather.humidity;
    weatherRes.weather = weather.weather;
    weatherRes.time = this._formatCreatedTime(entry);
    weatherRes.aqi = null;

    result.weather = weatherRes;
  }

  private _formatCreatedTime(entry: DayoneEntry): string {
    return dayjs.unix(entry.createdTime).add(DAYONE_TIMESTAMP_GAP, 'year').subtract(1, 'hour').format('HH:mm:ss');
  }
}
