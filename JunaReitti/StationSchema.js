export const StationSchema = {
  name: 'Stations',
  properties: {
    passengerTraffic: 'bool',
//    type: 'string',
    stationName: 'string',
    stationShortCode: 'string',
    id: 'int', // stationUICCode
//    countryCode: 'string',
    longitude: 'float',
    latitude: 'float'
  }
}
