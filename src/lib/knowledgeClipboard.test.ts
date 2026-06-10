import { afterEach, describe, expect, it, vi } from "vitest";
import { copyKnowledgeNoteMarkdown, formatKnowledgeNoteMarkdown } from "@/lib/knowledgeClipboard";
import type { KnowledgeItem } from "@/types/knowledge";

const item: KnowledgeItem = {
  id: "react-hooks",
  fileName: "react-hooks.md",
  title: "React hooks",
  tags: ["react"],
  content: "## Key idea\n\nUse hooks for state.",
  linkedQuizQuestions: [{ quizId: "react-basics", questionId: "hooks-1" }],
  createdAt: "2026-06-09T10:00:00.000Z",
  updatedAt: "2026-06-09T11:00:00.000Z",
};

describe("formatKnowledgeNoteMarkdown", () => {
  it("includes front matter and markdown body", () => {
    const markdown = formatKnowledgeNoteMarkdown(item);
    expect(markdown).toMatch(/^---\n/);
    expect(markdown).toContain("id: react-hooks");
    expect(markdown).toContain("title: React hooks");
    expect(markdown).toContain("tags:\n  - react");
    expect(markdown).toContain("quizId: react-basics");
    expect(markdown).toContain("## Key idea");
  });
});

describe("copyKnowledgeNoteMarkdown", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("writes serialized markdown to the clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    await copyKnowledgeNoteMarkdown(item);

    expect(writeText).toHaveBeenCalledWith(formatKnowledgeNoteMarkdown(item));
  });

  it("throws when clipboard is unavailable", async () => {
    vi.stubGlobal("navigator", {});

    await expect(copyKnowledgeNoteMarkdown(item)).rejects.toThrow(
      "Clipboard is not available in this environment.",
    );
  });
});
