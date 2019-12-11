import { Dimension } from "../dependencies/LayoutProvider";
export interface LayoutManagerInterface {
    getLayoutDimension(): Dimension;
    getLayouts(): Rect[];
    getOffsetForIndex(index: number): Point;
    overrideLayout(index: number, dim: Dimension): void;
    setMaxBounds(itemDim: Dimension): void;
    reLayoutFromIndex(startIndex: number, itemCount: number): void;
}
export interface Rect extends Dimension, Point {
    isOverridden?: boolean;
}
export interface Point {
    x: number;
    y: number;
}
