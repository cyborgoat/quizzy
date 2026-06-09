import { describe, expect, it } from "vitest";
import { formatShortDate } from "@/lib/formatDate";

describe("formatShortDate", () => {
  it("returns an em dash for missing values", () => {
    expect(formatShortDate(null)).toBe("—");
  });

  it("formats ISO timestamps as short locale dates", () => {
    expect(formatShortDate("2026-01-15T10:00:00.000Z")).toMatch(/2026/);
  });
});
