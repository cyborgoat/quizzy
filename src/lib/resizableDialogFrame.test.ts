import { describe, expect, it } from "vitest";
import {
  applyDialogResizeDelta,
  clampDialogSize,
  getDefaultDialogSize,
  getKnowledgeNoteDialogSizeConstraints,
} from "@/lib/resizableDialogFrame";

const constraints = {
  margin: 16,
  minWidth: 360,
  minHeight: 280,
  maxWidth: 1536,
  defaultWidth: 1024,
  maxHeight: 768,
};

describe("resizableDialogFrame", () => {
  it("uses configured default width while filling available height", () => {
    expect(getDefaultDialogSize(constraints)).toEqual({
      width: 1024,
      height: 768,
    });
  });

  it("falls back to max size when defaults are not provided", () => {
    expect(
      getDefaultDialogSize({
        margin: 16,
        minWidth: 360,
        minHeight: 280,
        maxWidth: 1536,
        maxHeight: 768,
      }),
    ).toEqual({
      width: 1248,
      height: 768,
    });
  });

  it("applies drag deltas to width and height together", () => {
    const start = { width: 400, height: 300 };
    expect(applyDialogResizeDelta(start, 80, 60, constraints)).toEqual({
      width: 480,
      height: 360,
    });
  });

  it("clamps resize deltas to minimum dimensions", () => {
    const start = { width: 400, height: 300 };
    expect(applyDialogResizeDelta(start, -200, -200, constraints)).toEqual({
      width: 360,
      height: 280,
    });
  });

  it("clamps oversized dimensions to the viewport", () => {
    expect(
      clampDialogSize({ width: 2000, height: 2000 }, constraints),
    ).toEqual({
      width: 1248,
      height: 768,
    });
  });

  it("uses larger defaults on wide viewports for knowledge note dialogs", () => {
    const largeScreen = getKnowledgeNoteDialogSizeConstraints({
      width: 2560,
      height: 1440,
    });

    expect(getDefaultDialogSize(largeScreen)).toEqual({
      width: 1600,
      height: 1000,
    });
    expect(largeScreen.maxWidth).toBe(2048);
    expect(largeScreen.maxHeight).toBe(1376);
  });

  it("keeps knowledge note dialogs within viewport margins", () => {
    const laptop = getKnowledgeNoteDialogSizeConstraints({
      width: 1280,
      height: 800,
    });

    expect(getDefaultDialogSize(laptop)).toEqual({
      width: 1024,
      height: 626,
    });
    expect(laptop.maxWidth).toBe(1216);
    expect(laptop.maxHeight).toBe(736);
  });
});
