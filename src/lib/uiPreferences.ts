export type UiFontSize = "small" | "default" | "large" | "extra-large";
export type UiDensity = "default" | "comfortable" | "spacious";

export const UI_FONT_SIZE_OPTIONS: { value: UiFontSize; label: string }[] = [
  { value: "small", label: "Small" },
  { value: "default", label: "Default" },
  { value: "large", label: "Large" },
  { value: "extra-large", label: "Extra large" },
];

export const UI_DENSITY_OPTIONS: { value: UiDensity; label: string }[] = [
  { value: "default", label: "Default" },
  { value: "comfortable", label: "Comfortable" },
  { value: "spacious", label: "Spacious" },
];

const FONT_SCALE: Record<UiFontSize, number> = {
  small: 0.875,
  default: 1,
  large: 1.125,
  "extra-large": 1.25,
};

const DENSITY_WIDTH_SCALE: Record<UiDensity, number> = {
  default: 1,
  comfortable: 1.08,
  spacious: 1.15,
};

const DENSITY_PADDING_SCALE: Record<UiDensity, number> = {
  default: 1,
  comfortable: 1.15,
  spacious: 1.3,
};

export function applyUiPreferences(fontSize: UiFontSize, density: UiDensity) {
  const root = document.documentElement;
  const fontScale = FONT_SCALE[fontSize];
  const widthScale = DENSITY_WIDTH_SCALE[density];
  const paddingScale = DENSITY_PADDING_SCALE[density];

  root.style.setProperty("--app-font-scale", String(fontScale));
  root.style.setProperty("--app-density-width-scale", String(widthScale));
  root.style.setProperty("--app-density-padding-scale", String(paddingScale));
  root.dataset.uiFontSize = fontSize;
  root.dataset.uiDensity = density;
}

export function parseUiFontSize(value: string | undefined): UiFontSize {
  if (value === "small" || value === "large" || value === "extra-large") return value;
  return "default";
}

export function parseUiDensity(value: string | undefined): UiDensity {
  if (value === "comfortable" || value === "spacious") return value;
  return "default";
}
