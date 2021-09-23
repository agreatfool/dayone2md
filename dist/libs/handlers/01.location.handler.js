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
class LocationHandler extends handler_1.Handler {
    execute(entryId, result) {
        return __awaiter(this, void 0, void 0, function* () {
            const entry = yield db_1.DB.get().entryDetailById(entryId);
            const locationId = entry.locationId;
            if (!locationId) {
                // no location data in this entry, skip
                return;
            }
            const location = yield db_1.DB.get().locationDetail(locationId);
            const locationRes = new result_1.ResLocation();
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
        });
    }
}
exports.default = LocationHandler;
//# sourceMappingURL=01.location.handler.js.map