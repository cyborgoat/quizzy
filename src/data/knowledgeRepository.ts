import { splitFrontMatter } from "@/lib/frontMatter";
import { fileNameStem } from "@/lib/knowledgeLinks";
import { knowledgeMetaSchema } from "@/data/knowledgeSchema";
import type { InvalidKnowledgeReport, KnowledgeItem } from "@/types/knowledge";

export type RawKnowledgeFile = {
  fileName: string;
  contents: string;
  readError?: string;
};

export type ParsedKnowledgeLibrary = {
  items: KnowledgeItem[];
  invalidReports: InvalidKnowledgeReport[];
};

function formatIssue(path: PropertyKey[], message: string) {
  return path.length > 0 ? `${path.join(".")}: ${message}` : message;
}

export function parseKnowledgeFiles(files: RawKnowledgeFile[]): ParsedKnowledgeLibrary {
  const items: KnowledgeItem[] = [];
  const invalidReports: InvalidKnowledgeReport[] = [];
  const seenIds = new Map<string, string>();
  const seenFileNames = new Set<string>();

  [...files]
    .sort((left, right) => left.fileName.localeCompare(right.fileName))
    .forEach((file) => {
      if (!file.fileName.toLowerCase().endsWith(".md")) {
        invalidReports.push({
          fileName: file.fileName,
          issues: ["Knowledge files must use the .md extension."],
        });
        return;
      }

      if (seenFileNames.has(file.fileName)) {
        invalidReports.push({
          fileName: file.fileName,
          issues: ["The working directory contains more than one file with this filename."],
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

      const split = splitFrontMatter(file.contents);
      if ("error" in split && split.error) {
        invalidReports.push({
          fileName: file.fileName,
          issues: [split.error],
        });
        return;
      }
      if ("error" in split) {
        invalidReports.push({
          fileName: file.fileName,
          issues: ["Knowledge file front matter could not be parsed."],
        });
        return;
      }

      const result = knowledgeMetaSchema.safeParse(split.frontMatter);
      if (!result.success) {
        invalidReports.push({
          fileName: file.fileName,
          issues: result.error.issues.map((issue) =>
            formatIssue(issue.path, issue.message),
          ),
        });
        return;
      }

      const duplicateFile = seenIds.get(result.data.id);
      if (duplicateFile) {
        invalidReports.push({
          fileName: file.fileName,
          issues: [`Duplicate knowledge id "${result.data.id}" (also used in ${duplicateFile}).`],
        });
        return;
      }

      const stem = fileNameStem(file.fileName);
      if (result.data.id !== stem) {
        invalidReports.push({
          fileName: file.fileName,
          issues: [`id "${result.data.id}" must match the filename stem "${stem}".`],
        });
        return;
      }

      seenIds.set(result.data.id, file.fileName);

      items.push({
        ...result.data,
        fileName: file.fileName,
        content: split.content,
      });
    });

  return { items, invalidReports };
}
