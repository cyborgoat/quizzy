import { describe, expect, it } from "vitest";
import { createFileVersionCache } from "@/lib/fileVersionCache";

describe("createFileVersionCache", () => {
  it("passes through fresh files and remembers their versions", () => {
    const cache = createFileVersionCache();
    const resolved = cache.resolve([
      { fileName: "a.json", contents: "A", version: "1" },
      { fileName: "b.json", contents: "B", version: "2" },
    ]);
    expect(resolved.map((file) => file.contents)).toEqual(["A", "B"]);
    expect(cache.knownVersions()).toEqual({ "a.json": "1", "b.json": "2" });
  });

  it("restores contents of unchanged files and updates changed ones", () => {
    const cache = createFileVersionCache();
    cache.resolve([
      { fileName: "a.json", contents: "A", version: "1" },
      { fileName: "b.json", contents: "B", version: "2" },
    ]);
    const resolved = cache.resolve([
      { fileName: "a.json", contents: "", version: "1", unchanged: true },
      { fileName: "b.json", contents: "B2", version: "3" },
    ]);
    expect(resolved).toEqual([
      { fileName: "a.json", contents: "A" },
      { fileName: "b.json", contents: "B2" },
    ]);
    expect(cache.knownVersions()).toEqual({ "a.json": "1", "b.json": "3" });
  });

  it("forgets files that disappeared", () => {
    const cache = createFileVersionCache();
    cache.resolve([{ fileName: "a.json", contents: "A", version: "1" }]);
    cache.resolve([]);
    expect(cache.knownVersions()).toEqual({});
  });

  it("reports unchanged files whose cached contents are missing", () => {
    const cache = createFileVersionCache();
    const [file] = cache.resolve([
      { fileName: "a.json", contents: "", version: "1", unchanged: true },
    ]);
    expect(file.readError).toMatch(/Refresh/);
  });

  it("does not cache files with read errors and clears on demand", () => {
    const cache = createFileVersionCache();
    cache.resolve([
      { fileName: "bad.json", contents: "", readError: "denied" },
      { fileName: "ok.json", contents: "x", version: "9" },
    ]);
    expect(cache.knownVersions()).toEqual({ "ok.json": "9" });
    cache.clear();
    expect(cache.knownVersions()).toEqual({});
  });
});
