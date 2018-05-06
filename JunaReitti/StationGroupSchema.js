export const StationGroupSchema = {
    name: 'StationGroup',
    primaryKey: 'id',
    properties: {
        id: 'int',
        lastUpdated: 'date',
        stations: 'Station[]',
    }
}
