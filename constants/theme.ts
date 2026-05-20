export const lightColors = {
  ink: "#18211E",
  mutedInk: "#5E6862",
  faintInk: "#7B867F",
  paper: "#F8F8F5",
  surface: "#FFFFFF",
  line: "#DCE2DD",
  softLine: "#EBEFEC",
  teal: "#0B776D",
  tealSoft: "#E7F3F1",
  clay: "#A94E3F",
  claySoft: "#F4E9E6",
  amber: "#9C6B16",
  amberSoft: "#F5EDDC",
  green: "#2E7650",
  greenSoft: "#E6F1EA",
  black: "#0D1210",
  white: "#FFFFFF",
  buttonBg: "#18211E",
  buttonPressed: "#000000",
  buttonText: "#FFFFFF",
};

export const darkColors = {
  ink: "#F1F5F1",
  mutedInk: "#AEBAB2",
  faintInk: "#748077",
  paper: "#050806",
  surface: "#0B110E",
  line: "#27312B",
  softLine: "#151D18",
  teal: "#6ED8CB",
  tealSoft: "#082420",
  clay: "#F08C78",
  claySoft: "#24110E",
  amber: "#E8BE63",
  amberSoft: "#201705",
  green: "#8ED7A8",
  greenSoft: "#0D2417",
  black: "#000000",
  white: "#FFFFFF",
  buttonBg: "#EAF2EC",
  buttonPressed: "#FFFFFF",
  buttonText: "#050806",
};

export type ThemeMode = "light" | "dark";

export const colors = { ...lightColors };

export function setActiveTheme(mode: ThemeMode) {
  Object.assign(colors, mode === "dark" ? darkColors : lightColors);
}

export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 6,
  card: 8,
  pill: 999,
};

export const typography = {
  title: 30,
  section: 20,
  body: 16,
  small: 13,
  caption: 12,
};
