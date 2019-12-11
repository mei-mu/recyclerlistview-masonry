export default class RecycleItemPool {
    private _recyclableObjectMap;
    private _availabilitySet;
    constructor();
    putRecycledObject(objectType: string | number, object: number): void;
    getRecycledObject(objectType: string | number): string | null;
    removeFromPool(object: number): boolean;
    clearAll(): void;
    private _getRelevantSet(objectType);
    private _stringify(objectType);
}
