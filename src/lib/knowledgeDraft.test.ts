import { afterEach, describe, expect, it } from "vitest";
import {
  buildKnowledgeDraft,
  parseTagsInput,
  resolveKnowledgeNoteSource,
  stashKnowledgeDraft,
  validateKnowledgeNote,
} from "@/lib/knowledgeDraft";
import type { KnowledgeItem } from "@/types/knowledge";

afterEach(() => {
  sessionStorage.clear();
});

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

describe("resolveKnowledgeNoteSource", () => {
  const persisted: KnowledgeItem = {
    id: "saved-note",
    fileName: "saved-note.md",
    title: "Saved",
    tags: [],
    content: "From disk",
    linkedQuizQuestions: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  const staleFallback: KnowledgeItem = {
    id: "draft-1",
    fileName: "",
    title: "",
    tags: [],
    content: "",
    linkedQuizQuestions: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  it("prefers persisted items from the library", () => {
    expect(resolveKnowledgeNoteSource("saved-note", [persisted], staleFallback)).toBe(persisted);
  });

  it("prefers session draft over a stale fallback prop", () => {
    const stashed: KnowledgeItem = {
      ...staleFallback,
      title: "In progress",
      content: "Typed before alt-tab",
    };
    stashKnowledgeDraft(stashed);

    expect(resolveKnowledgeNoteSource("draft-1", [], staleFallback)).toEqual(stashed);
  });

  it("uses fallback when no library item or session draft exists", () => {
    expect(resolveKnowledgeNoteSource("draft-1", [], staleFallback)).toBe(staleFallback);
  });

  it("ignores fallback when ids do not match", () => {
    expect(resolveKnowledgeNoteSource("other-id", [], staleFallback)).toBeUndefined();
  });
});
