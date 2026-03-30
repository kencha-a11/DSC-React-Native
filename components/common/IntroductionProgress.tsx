import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Modal, Image, Animated, Easing, Dimensions } from "react-native";

interface IntroductionProgressProps {
  visible?: boolean;
  progress?: number;
  animationDuration?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const IntroductionProgress: React.FC<IntroductionProgressProps> = ({
  visible = true,
  progress = 0,
  animationDuration = 600,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    // Add a listener to synchronize the text progress with the animated bar
    const listenerId = animatedValue.addListener(({ value }) => {
      setDisplayProgress(Math.round(value));
    });

    return () => {
      animatedValue.removeListener(listenerId);
    };
  }, [animatedValue]);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: Math.min(100, Math.max(0, progress)),
      duration: animationDuration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, animatedValue, animationDuration]);

  if (!visible) return null;

  const width = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <Modal visible={visible} transparent={false} animationType="fade" statusBarTranslucent>
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Image
            source={require("@/assets/logo/dsc-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.brandText}>S O U V E N I R S</Text>
        </View>

        <View style={styles.progressWrapper}>
          <View style={styles.track}>
            <Animated.View style={[styles.fill, { width }]} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.loadingText}>
              {displayProgress < 50 ? "Initializing..." : displayProgress < 85 ? "Checking Secure Storage..." : displayProgress < 100 ? "Retrieving User Data..." : "Ready!"}
            </Text>
            <Text style={styles.percentText}>{displayProgress}%</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 80,
  },
  logo: {
    width: SCREEN_WIDTH * 1,
    height: SCREEN_WIDTH * 1,
    maxWidth: 200,
    maxHeight: 200,
  },
  brandText: {
    marginTop: 16,
    fontSize: 15,
    letterSpacing: 6,
    color: "#8E248D",
    fontWeight: "700",
  },
  progressWrapper: {
    width: "70%",
    maxWidth: 400,
    alignItems: "center",
    paddingBottom: 60,
  },
  track: {
    width: "100%",
    height: 10,
    backgroundColor: "#F0F0F0",
    borderRadius: 5,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: "#ED277C",
    borderRadius: 5,
  },
  textContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 14,
  },
  loadingText: {
    fontSize: 12,
    color: "#888",
    fontWeight: "500",
  },
  percentText: {
    fontSize: 12,
    color: "#555",
    fontWeight: "600",
  },
});

export default IntroductionProgress;