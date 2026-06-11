import { describe, expect, it } from "vitest";
import {
  formatZoomLimitMessage,
  formatZoomSizeMessage,
  UI_FONT_SIZE_MAX,
  UI_FONT_SIZE_MIN,
} from "@/lib/uiPreferences";

describe("formatZoomSizeMessage", () => {
  it("formats the zoom percentage shown in settings", () => {
    expect(formatZoomSizeMessage(105)).toBe("Zoom size set to 105%.");
    expect(formatZoomSizeMessage(100)).toBe("Zoom size set to 100%.");
  });
});

describe("formatZoomLimitMessage", () => {
  it("describes the minimum and maximum zoom limits", () => {
    expect(formatZoomLimitMessage("up")).toBe(
      `Cannot zoom in further. Maximum zoom is ${UI_FONT_SIZE_MAX}%.`,
    );
    expect(formatZoomLimitMessage("down")).toBe(
      `Cannot zoom out further. Minimum zoom is ${UI_FONT_SIZE_MIN}%.`,
    );
  });
});
