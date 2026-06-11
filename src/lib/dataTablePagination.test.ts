import { describe, expect, it } from "vitest";
import { getPaginationItems } from "@/lib/dataTablePagination";

describe("getPaginationItems", () => {
  it("returns every page when total pages is small", () => {
    expect(getPaginationItems(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("uses a sliding window for large page counts", () => {
    expect(getPaginationItems(10, 20)).toEqual([
      1,
      "ellipsis",
      9,
      10,
      11,
      "ellipsis",
      20,
    ]);
  });
});
