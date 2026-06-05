import { describe, expect, it } from "vitest";
import { parseQuizFiles } from "@/data/quizRepository";

function quiz(id: string) {
  return JSON.stringify({
    id,
    title: id,
    tags: [],
    questions: [
      {
        id: "q1",
        type: "true_false",
        prompt: "Valid?",
        answer: true,
      },
    ],
  });
}

describe("parseQuizFiles", () => {
  it("skips malformed JSON and duplicate quiz IDs", () => {
    const result = parseQuizFiles([
      { fileName: "a.json", contents: quiz("shared") },
      { fileName: "b.json", contents: quiz("shared") },
      { fileName: "broken.json", contents: "{" },
    ]);
    expect(result.quizzes).toHaveLength(1);
    expect(result.invalidReports).toHaveLength(2);
  });

  it("reports unreadable and duplicate-filename imports", () => {
    const result = parseQuizFiles([
      { fileName: "same.json", contents: quiz("one") },
      { fileName: "same.json", contents: quiz("two") },
      { fileName: "locked.json", contents: "", readError: "permission denied" },
    ]);
    expect(result.quizzes).toHaveLength(1);
    expect(result.invalidReports.map((report) => report.fileName)).toEqual([
      "locked.json",
      "same.json",
    ]);
  });
});
