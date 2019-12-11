/**
 * Created by talha.naqvi on 05/04/17.
 * You can create a new instance or inherit and override default methods
 * You may need access to data provider here, it might make sense to pass a function which lets you fetch the latest data provider
 * Why only indexes? The answer is to allow data virtualization in the future. Since layouts are accessed much before the actual render assuming having all
 * data upfront will only limit possibilites in the future.
 *
 * By design LayoutProvider forces you to think in terms of view types. What that means is that you'll always be dealing with a finite set of view templates
 * with deterministic dimensions. We want to eliminate unnecessary re-layouts that happen when height, by mistake, is not taken into consideration.
 * This patters ensures that your scrolling is as smooth as it gets. You can always increase the number of types to handle non deterministic scenarios.
 *
 * NOTE: You can also implement features such as ListView/GridView switch by simple changing your layout provider.
 */
export default class LayoutProvider {
    private _getLayoutTypeForIndex;
    private _setLayoutForType;
    constructor(getLayoutTypeForIndex: (index: number) => LayoutType, setLayoutForType: (type: LayoutType, dim: Dimension, index: number) => void);
    getLayoutTypeForIndex(index: number): LayoutType;
    setLayoutForType(type: LayoutType, dimension: Dimension, index: number): void;
}
export interface Dimension {
    height: number;
    width: number;
}
export declare enum LayoutType {
    SINGLE = 1,
    SPAN = 2,
}
