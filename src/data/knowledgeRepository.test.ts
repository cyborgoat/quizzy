import { describe, expect, it } from "vitest";
import { serializeKnowledgeFile } from "@/lib/frontMatter";
import { parseKnowledgeFiles } from "@/data/knowledgeRepository";

const baseMeta = {
  id: "note-one",
  title: "First note",
  tags: ["react"],
  linkedQuizQuestions: [{ quizId: "react-basics", questionId: "q1" }],
  views: 0,
  createdAt: "2026-06-09T10:00:00.000Z",
  updatedAt: "2026-06-09T10:00:00.000Z",
};

describe("parseKnowledgeFiles", () => {
  it("parses valid knowledge files", () => {
    const library = parseKnowledgeFiles([
      {
        fileName: "note-one.md",
        contents: serializeKnowledgeFile(baseMeta, "Hello"),
      },
    ]);

    expect(library.invalidReports).toHaveLength(0);
    expect(library.items).toHaveLength(1);
    expect(library.items[0]?.title).toBe("First note");
  });

  it("reports duplicate ids", () => {
    const library = parseKnowledgeFiles([
      {
        fileName: "note-one.md",
        contents: serializeKnowledgeFile(baseMeta, "One"),
      },
      {
        fileName: "note-two.md",
        contents: serializeKnowledgeFile(baseMeta, "Duplicate"),
      },
    ]);

    expect(library.items).toHaveLength(1);
    expect(library.invalidReports).toHaveLength(1);
    expect(library.invalidReports[0]?.issues[0]).toContain('Duplicate knowledge id "note-one"');
  });

  it("reports id and filename mismatches", () => {
    const library = parseKnowledgeFiles([
      {
        fileName: "different-name.md",
        contents: serializeKnowledgeFile(baseMeta, "Mismatch"),
      },
    ]);

    expect(library.items).toHaveLength(0);
    expect(library.invalidReports[0]?.issues[0]).toContain("must match the filename stem");
  });

  it("defaults views to zero when omitted from front matter", () => {
    const contents = `---
id: note-one
title: First note
tags:
  - react
linkedQuizQuestions:
  - quizId: react-basics
    questionId: q1
createdAt: "2026-06-09T10:00:00.000Z"
updatedAt: "2026-06-09T10:00:00.000Z"
---
Hello`;

    const library = parseKnowledgeFiles([
      {
        fileName: "note-one.md",
        contents,
      },
    ]);

    expect(library.invalidReports).toHaveLength(0);
    expect(library.items[0]?.views).toBe(0);
  });
});
