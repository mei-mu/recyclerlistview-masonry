/***
 * You can create a new instance or inherit and override default methods
 * Allows access to data and size. Clone with rows creates a new data provider and let listview know where to calculate row layout from.
 */
export default class DataProvider {
    rowHasChanged: (r1: any, r2: any) => boolean;
    private _firstIndexToProcess;
    private _size;
    private _data;
    constructor(rowHasChanged: (r1: any, r2: any) => boolean);
    getDataForIndex(index: number): any;
    getAllData(): any[];
    getSize(): number;
    getFirstIndexToProcessInternal(): number;
    cloneWithRows(newData: any[]): DataProvider;
}
