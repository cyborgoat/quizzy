import { describe, expect, it } from "vitest";
import { shouldSyncKnowledgeEditorMarkdown } from "@/lib/knowledgeMarkdownEditorSync";

describe("shouldSyncKnowledgeEditorMarkdown", () => {
  it("syncs when external value differs from last emitted value", () => {
    expect(shouldSyncKnowledgeEditorMarkdown("loaded", "typed")).toBe(true);
  });

  it("skips sync when value matches last emitted value from typing", () => {
    expect(shouldSyncKnowledgeEditorMarkdown("same", "same")).toBe(false);
  });
});
