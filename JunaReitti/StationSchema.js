export const StationSchema = {
  name: 'Station',
    primaryKey: 'id',
  properties: {
    id: 'int', // stationUICCode
    passengerTraffic: 'bool',
    stationName: 'string',
    stationShortCode: 'string',
    longitude: 'float',
    latitude: 'float'

    //type: 'string',
    //countryCode: 'string',

  }
}
