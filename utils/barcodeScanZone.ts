import { Dimensions } from "react-native";

const {
    width: screenWidth,
    height: screenHeight
} = Dimensions.get('window')

export const scanZone = {
    x: screenWidth * 0.05,
    y: screenHeight * 0.25,
    width: screenWidth * 0.9,
    height: screenHeight * 0.3,
}

export const isInsideRect = (
    bounds: any,
    zone: typeof scanZone
) => {
    if (!bounds?.origin || !bounds?.size) return false
    const barcodeBox = {
        x: bounds.origin.x,
        y: bounds.origin.y,
        width: bounds.size.width,
        height: bounds.size.height,
    }

    return (
        barcodeBox.x < zone.x + zone.width &&
        barcodeBox.x + barcodeBox.width > zone.x &&
        barcodeBox.y < zone.y + zone.height &&
        barcodeBox.y + barcodeBox.height > zone.y
    )
}