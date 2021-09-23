import { Handler } from '../handler';
import { ResData, ResLocation } from '../result';
import { DB } from '../db';

export default class LocationHandler extends Handler {
  public async execute(entryId: number, result: ResData): Promise<void> {
    const entry = await DB.get().entryDetailById(entryId);
    const locationId = entry.locationId;
    if (!locationId) {
      // no location data in this entry, skip
      return;
    }

    const location = await DB.get().locationDetail(locationId);

    const locationRes = new ResLocation();
    locationRes.altitude = location.altitude;
    locationRes.latitude = location.latitude;
    locationRes.longitude = location.longitude;
    locationRes.address = location.address;
    locationRes.placename = location.placename;
    locationRes.district = null;
    locationRes.city = location.city;
    locationRes.province = location.province;
    locationRes.country = location.country;

    result.location = locationRes;
  }
}
