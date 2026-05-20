import { Image } from "expo-image";
import { Text, View } from "react-native";

type SymbolIconProps = {
  name: string;
  color: string;
  size?: number;
  fallback?: string;
};

export function SymbolIcon({ name, color, size = 20, fallback = "*" }: SymbolIconProps) {
  if (process.env.EXPO_OS !== "ios") {
    return (
      <View
        style={{
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color, fontSize: Math.max(12, size - 6), fontWeight: "700" }}>
          {fallback}
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={`sf:${name}`}
      tintColor={color}
      style={{ width: size, height: size }}
      contentFit="contain"
    />
  );
}
