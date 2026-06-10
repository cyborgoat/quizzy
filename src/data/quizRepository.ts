import { quizSchema } from "@/data/quizSchema";
import { formatIssue } from "@/lib/formatIssue";
import type { InvalidQuizReport, QuizSource } from "@/types/quiz";

export type RawQuizFile = {
  fileName: string;
  contents: string;
  readError?: string;
};

export type ParsedQuizLibrary = {
  quizzes: QuizSource[];
  invalidReports: InvalidQuizReport[];
};

export function parseQuizFiles(files: RawQuizFile[]): ParsedQuizLibrary {
  const quizzes: QuizSource[] = [];
  const invalidReports: InvalidQuizReport[] = [];
  const seenQuizIds = new Map<string, string>();
  const seenFileNames = new Set<string>();

  [...files]
    .sort((left, right) => left.fileName.localeCompare(right.fileName))
    .forEach((file) => {
      if (seenFileNames.has(file.fileName)) {
        invalidReports.push({
          fileName: file.fileName,
          issues: ["The quiz directory contains more than one file with this filename."],
        });
        return;
      }
      seenFileNames.add(file.fileName);

      if (file.readError) {
        invalidReports.push({
          fileName: file.fileName,
          issues: [`File could not be read: ${file.readError}`],
        });
        return;
      }

      let json: unknown;
      try {
        json = JSON.parse(file.contents);
      } catch {
        invalidReports.push({
          fileName: file.fileName,
          issues: ["File is not valid JSON."],
        });
        return;
      }

      const result = quizSchema.safeParse(json);
      if (!result.success) {
        invalidReports.push({
          fileName: file.fileName,
          issues: result.error.issues.map((issue) =>
            formatIssue(issue.path, issue.message),
          ),
        });
        return;
      }

      const existingFile = seenQuizIds.get(result.data.id);
      if (existingFile) {
        invalidReports.push({
          fileName: file.fileName,
          issues: [`Quiz ID "${result.data.id}" is already used by ${existingFile}.`],
        });
        return;
      }

      seenQuizIds.set(result.data.id, file.fileName);
      quizzes.push({ fileName: file.fileName, quiz: result.data });
    });

  return { quizzes, invalidReports };
}
