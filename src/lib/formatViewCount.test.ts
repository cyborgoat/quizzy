import { describe, expect, it } from "vitest";
import { formatViewCount } from "@/lib/formatViewCount";

describe("formatViewCount", () => {
  it("uses singular for one view", () => {
    expect(formatViewCount(1)).toBe("1 view");
  });

  it("uses plural for other counts", () => {
    expect(formatViewCount(0)).toBe("0 views");
    expect(formatViewCount(2)).toBe("2 views");
  });
});
