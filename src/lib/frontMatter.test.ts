import { describe, expect, it } from "vitest";
import { serializeKnowledgeFile, splitFrontMatter } from "@/lib/frontMatter";

const sampleMeta = {
  id: "react-useeffect-cleanup",
  title: "useEffect cleanup patterns",
  tags: ["react", "hooks"],
  linkedQuizQuestions: [
    { quizId: "react-basics", questionId: "useeffect-cleanup" },
  ],
  createdAt: "2026-06-09T10:00:00.000Z",
  updatedAt: "2026-06-09T10:00:00.000Z",
};

describe("splitFrontMatter", () => {
  it("parses valid knowledge file front matter and body", () => {
    const contents = serializeKnowledgeFile(sampleMeta, "## Key idea\n\nAlways clean up.");
    const result = splitFrontMatter(contents);
    expect("error" in result).toBe(false);
    if ("error" in result) return;

    expect(result.frontMatter.id).toBe(sampleMeta.id);
    expect(result.frontMatter.title).toBe(sampleMeta.title);
    expect(result.frontMatter.tags).toEqual(sampleMeta.tags);
    expect(result.frontMatter.linkedQuizQuestions).toEqual(sampleMeta.linkedQuizQuestions);
    expect(result.content).toContain("## Key idea");
  });

  it("rejects files without front matter", () => {
    const result = splitFrontMatter("# Just markdown");
    expect(result).toEqual({
      error: "Knowledge file must start with YAML front matter (---).",
    });
  });
});

describe("serializeKnowledgeFile", () => {
  it("round-trips through splitFrontMatter", () => {
    const serialized = serializeKnowledgeFile(sampleMeta, "Body text");
    const parsed = splitFrontMatter(serialized);
    expect("error" in parsed).toBe(false);
    if ("error" in parsed) return;
    expect(parsed.content).toBe("Body text");
    expect(parsed.frontMatter.updatedAt).toBe(sampleMeta.updatedAt);
  });
});
