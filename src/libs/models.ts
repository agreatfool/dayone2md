export interface DayoneEntry {
  id: number;
  uuid: string; // value in "[post name here](dayone2://view?entryId=CC08EAA4F4B144EBBA74E416DCDB0B66)"
  year: number;
  month: number;
  day: number;
  locationId: number;
  weatherId: number;
  createdTime: number;
  markdown: string;
}

export interface DayoneEntryId {
  id: number;
}

export interface DayoneWeather {
  id: number;
  entryId: number;
  humidity: number;
  temperature: number;
  weather: string;
}

export interface DayoneLocation {
  id: number;
  altitude: number;
  latitude: number;
  longitude: number;
  address: string;
  placename: string;
  province: string;
  city: string;
  country: string;
}

export interface DayoneTag {
  id: number;
  name: string;
}

export interface DayoneTagId {
  tagId: number;
}

export interface DayoneAttachment {
  id: number;
  entryId: number;
  uuid: string; // value in "![](dayone-moment://9A2D00938E4C4967920ED8C83C3060AB)"
  filename: string;
  filetype: string;
}
