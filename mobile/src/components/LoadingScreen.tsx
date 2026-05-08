import React, { useState, useEffect } from "react";
import { View, Text, Image, StyleSheet } from "react-native";

interface LoadingScreenProps {
  message: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message }) => {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prevDots) => {
        if (prevDots === "....") return ".";
        return prevDots + ".";
      });
    }, 400);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      {/* Watermark */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Image
            source={require("../../assets/medefix background.jpeg")}
            style={{ width: 300, height: 300, opacity: 0.07 }}
            resizeMode="contain"
          />
        </View>
      </View>

      <Image
        source={require("../../assets/minion.png")}
        style={styles.image}
        resizeMode="contain"
      />
      <Text style={styles.text}>
        {message}
        <Text style={styles.dots}>{dots}</Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F5F0",
  },
  image: {
    width: 150,
    height: 150,
    marginBottom: 24,
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  dots: {
    color: "#FF6B35",
    fontWeight: "700",
  },
});

export default LoadingScreen;
