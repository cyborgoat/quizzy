export const UI_FONT_SIZE_MIN = 75;
export const UI_FONT_SIZE_MAX = 150;
export const UI_FONT_SIZE_DEFAULT = 100;
export const UI_FONT_SIZE_STEP = 5;

const LEGACY_FONT_SIZE: Record<string, number> = {
  small: 88,
  default: 100,
  large: 113,
  "extra-large": 125,
};

export function clampFontSize(value: number): number {
  if (!Number.isFinite(value)) return UI_FONT_SIZE_DEFAULT;
  return Math.min(UI_FONT_SIZE_MAX, Math.max(UI_FONT_SIZE_MIN, Math.round(value)));
}

export function formatZoomSizeMessage(fontSize: number) {
  return `Zoom size set to ${clampFontSize(fontSize)}%.`;
}

export function formatZoomLimitMessage(direction: "up" | "down") {
  if (direction === "up") {
    return `Cannot zoom in further. Maximum zoom is ${UI_FONT_SIZE_MAX}%.`;
  }
  return `Cannot zoom out further. Minimum zoom is ${UI_FONT_SIZE_MIN}%.`;
}

export function parseUiFontSize(value: unknown): number {
  if (typeof value === "number") {
    return clampFontSize(value);
  }

  if (typeof value === "string") {
    const legacy = LEGACY_FONT_SIZE[value];
    if (legacy !== undefined) return legacy;

    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return clampFontSize(parsed);
    }
  }

  return UI_FONT_SIZE_DEFAULT;
}

export function stepFontSize(
  current: number,
  direction: "up" | "down",
): number | null {
  const clamped = clampFontSize(current);
  const next =
    direction === "up" ? clamped + UI_FONT_SIZE_STEP : clamped - UI_FONT_SIZE_STEP;

  if (next < UI_FONT_SIZE_MIN || next > UI_FONT_SIZE_MAX) {
    return null;
  }

  return next;
}

export function validateFontSizeInput(value: string): string | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    return `Enter a whole number between ${UI_FONT_SIZE_MIN} and ${UI_FONT_SIZE_MAX}.`;
  }
  if (parsed < UI_FONT_SIZE_MIN || parsed > UI_FONT_SIZE_MAX) {
    return `Font size must be between ${UI_FONT_SIZE_MIN} and ${UI_FONT_SIZE_MAX} percent.`;
  }
  return null;
}

export function applyUiPreferences(fontSize: number) {
  const root = document.documentElement;
  const fontScale = clampFontSize(fontSize) / 100;

  root.style.setProperty("--app-font-scale", String(fontScale));
  root.dataset.uiFontSize = String(clampFontSize(fontSize));
}
