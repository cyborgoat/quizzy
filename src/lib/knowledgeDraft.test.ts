import { describe, expect, it } from "vitest";
import {
  buildKnowledgeDraft,
  parseTagsInput,
  validateKnowledgeNote,
} from "@/lib/knowledgeDraft";

describe("validateKnowledgeNote", () => {
  it("requires title and content", () => {
    expect(validateKnowledgeNote({ title: "", content: "" })).toBe("Title is required.");
    expect(validateKnowledgeNote({ title: "Hooks", content: "" })).toBe(
      "Content is required.",
    );
    expect(validateKnowledgeNote({ title: "Hooks", content: "Notes" })).toBeNull();
  });
});

describe("parseTagsInput", () => {
  it("splits comma-separated tags and preserves non-ascii characters", () => {
    expect(parseTagsInput("react, 钩子, 日本語 ")).toEqual(["react", "钩子", "日本語"]);
  });
});

describe("buildKnowledgeDraft", () => {
  it("creates an unsaved draft without default title or content", () => {
    const draft = buildKnowledgeDraft();
    expect(draft.title).toBe("");
    expect(draft.content).toBe("");
    expect(draft.fileName).toBe("");
  });
});
