import {Dimensions} from "react-native";
import LayoutProvider, {LayoutType} from "./LayoutProvider";

export class LayoutUtil {
    static getWindowWidth(offset: number | undefined) {
        // To deal with precision issues on android
        return Math.round(Dimensions.get("window").width * 1000) / 1000 - (offset || 0); //Adjustment for margin given to RLV;
    }

    static getLayoutProvider(data: UIData[], offset: number | undefined) {
        return new LayoutProvider(
            index => {
                return data[index] != null && data[index].viewType != null
                    ? data[index].viewType
                    : LayoutType.SINGLE; //Since we have just one view type
            },
            (type, dim, index) => {
                let dataElement = data[index];
                if(!dataElement) return;
                let columnWidth = 0;
                let columnHeight = 0;
                switch (type) {
                    case LayoutType.SPAN:
                        columnWidth = LayoutUtil.getWindowWidth(offset);
                        columnHeight =
                            (columnWidth * dataElement.height) / dataElement.width;
                        break;
                    case LayoutType.SINGLE:
                        columnWidth = LayoutUtil.getWindowWidth(offset) / 2;
                        columnHeight =
                            (columnWidth * dataElement.height) / dataElement.width;
                    default:
                        break;
                }

                dim.width = columnWidth;
                dim.height = columnHeight;
            }
        );
    }
}

export interface UIData {
    height: number,
    width: number,
    viewType: LayoutType
}
