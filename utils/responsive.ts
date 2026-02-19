import { Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

// ------------------------------
// Icon sizes based on screen width
// ------------------------------
export const iconSize = {
  extraSmall: width * 0.04, 
  small: width * 0.08,   // 8% of screen width
  medium: width * 0.12,  // 12% of screen width
  large: width * 0.16,   // 16% of screen width
};

// ------------------------------
// Image sizes based on screen width
// ------------------------------
export const imageSize = {
  logo: width * 0.3,      // 30% of screen width
  avatar: width * 0.2,    // 20% of screen width
  banner: width * 0.8,    // 80% of screen width
  icon: width * 0.1,      // 10% of screen width
  product: width * 0.2
};
