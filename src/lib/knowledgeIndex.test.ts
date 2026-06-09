import { describe, expect, it } from "vitest";
import { buildKnowledgeIndex, getKnowledgeForQuestion } from "@/lib/knowledgeIndex";
import type { KnowledgeItem } from "@/types/knowledge";

const items: KnowledgeItem[] = [
  {
    id: "older",
    title: "Older note",
    tags: [],
    linkedQuizQuestions: [{ quizId: "quiz-a", questionId: "q1" }],
    createdAt: "2026-06-01T10:00:00.000Z",
    updatedAt: "2026-06-01T10:00:00.000Z",
    fileName: "older.md",
    content: "",
  },
  {
    id: "newer",
    title: "Newer note",
    tags: [],
    linkedQuizQuestions: [{ quizId: "quiz-a", questionId: "q1" }],
    createdAt: "2026-06-09T10:00:00.000Z",
    updatedAt: "2026-06-09T10:00:00.000Z",
    fileName: "newer.md",
    content: "",
  },
];

describe("buildKnowledgeIndex", () => {
  it("groups notes by question and sorts newest first", () => {
    const index = buildKnowledgeIndex(items);
    const linked = getKnowledgeForQuestion(index, "quiz-a", "q1");
    expect(linked.map((item) => item.id)).toEqual(["newer", "older"]);
  });
});
