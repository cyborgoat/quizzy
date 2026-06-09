import type { LinkedQuizQuestion } from "@/types/knowledge";

export type ParsedFrontMatter = {
  id?: string;
  title?: string;
  tags?: string[];
  linkedQuizQuestions?: LinkedQuizQuestion[];
  createdAt?: string;
  updatedAt?: string;
};

function stripUtf8Bom(contents: string) {
  return contents.charCodeAt(0) === 0xfeff ? contents.slice(1) : contents;
}

function parseScalarValue(raw: string) {
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseFrontMatterYaml(yaml: string): ParsedFrontMatter {
  const result: ParsedFrontMatter = {};
  const lines = yaml.replace(/\r\n/g, "\n").split("\n");
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();
    index += 1;

    if (!trimmed || trimmed.startsWith("#")) continue;

    const colonIndex = trimmed.indexOf(":");
    if (colonIndex === -1) continue;

    const key = trimmed.slice(0, colonIndex).trim();
    const valuePart = trimmed.slice(colonIndex + 1).trim();

    if (key === "tags") {
      if (!valuePart) {
        const tags: string[] = [];
        while (index < lines.length) {
          const next = lines[index];
          const match = next.match(/^\s*-\s*(.+)$/);
          if (!match) break;
          tags.push(parseScalarValue(match[1]));
          index += 1;
        }
        result.tags = tags;
      } else {
        result.tags = [parseScalarValue(valuePart)];
      }
      continue;
    }

    if (key === "linkedQuizQuestions") {
      if (valuePart === "[]") {
        result.linkedQuizQuestions = [];
        continue;
      }

      const links: LinkedQuizQuestion[] = [];
      while (index < lines.length) {
        const next = lines[index];
        const listItemMatch = next.match(/^\s*-\s*(.*)$/);
        if (!listItemMatch) break;
        index += 1;

        const link: Partial<LinkedQuizQuestion> = {};
        const inlineValue = listItemMatch[1].trim();
        if (inlineValue) {
          const inlineMatch = inlineValue.match(/^(\w+):\s*(.+)$/);
          if (inlineMatch) {
            const [, fieldKey, fieldValue] = inlineMatch;
            if (fieldKey === "quizId") link.quizId = parseScalarValue(fieldValue);
            if (fieldKey === "questionId") link.questionId = parseScalarValue(fieldValue);
          }
        }

        while (index < lines.length) {
          const fieldLine = lines[index];
          const fieldMatch = fieldLine.match(/^\s{2,}(\w+):\s*(.+)$/);
          if (!fieldMatch) break;
          const [, fieldKey, fieldValue] = fieldMatch;
          if (fieldKey === "quizId") link.quizId = parseScalarValue(fieldValue);
          if (fieldKey === "questionId") link.questionId = parseScalarValue(fieldValue);
          index += 1;
        }

        if (link.quizId && link.questionId) {
          links.push({ quizId: link.quizId, questionId: link.questionId });
        }
      }
      result.linkedQuizQuestions = links;
      continue;
    }

    const scalar = parseScalarValue(valuePart);
    if (key === "id") result.id = scalar;
    if (key === "title") result.title = scalar;
    if (key === "createdAt") result.createdAt = scalar;
    if (key === "updatedAt") result.updatedAt = scalar;
  }

  return result;
}

export function splitFrontMatter(contents: string) {
  const normalized = stripUtf8Bom(contents);
  if (!normalized.startsWith("---\n") && !normalized.startsWith("---\r\n")) {
    return { error: "Knowledge file must start with YAML front matter (---)." };
  }

  const closingIndex = normalized.indexOf("\n---", 4);
  if (closingIndex === -1) {
    return { error: "Knowledge file front matter is not closed with ---." };
  }

  const yaml = normalized.slice(4, closingIndex);
  const bodyStart = closingIndex + 4;
  const content =
    bodyStart < normalized.length && normalized[bodyStart] === "\n"
      ? normalized.slice(bodyStart + 1)
      : normalized.slice(bodyStart);

  return {
    frontMatter: parseFrontMatterYaml(yaml),
    content,
  };
}

function yamlScalar(value: string) {
  if (/[:#\n\r]/.test(value) || value === "") {
    return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return value;
}

function yamlStringList(key: string, values: string[]) {
  if (values.length === 0) return `${key}: []`;
  return `${key}:\n${values.map((value) => `  - ${yamlScalar(value)}`).join("\n")}`;
}

function yamlLinkedQuestions(links: LinkedQuizQuestion[]) {
  if (links.length === 0) return "linkedQuizQuestions: []";
  return [
    "linkedQuizQuestions:",
    ...links.map(
      (link) =>
        `  - quizId: ${yamlScalar(link.quizId)}\n    questionId: ${yamlScalar(link.questionId)}`,
    ),
  ].join("\n");
}

export function serializeKnowledgeFile(
  meta: {
    id: string;
    title: string;
    tags: string[];
    linkedQuizQuestions: LinkedQuizQuestion[];
    createdAt: string;
    updatedAt: string;
  },
  content: string,
) {
  const frontMatter = [
    "---",
    `id: ${yamlScalar(meta.id)}`,
    `title: ${yamlScalar(meta.title)}`,
    yamlStringList("tags", meta.tags),
    yamlLinkedQuestions(meta.linkedQuizQuestions),
    `createdAt: ${yamlScalar(meta.createdAt)}`,
    `updatedAt: ${yamlScalar(meta.updatedAt)}`,
    "---",
    "",
  ].join("\n");

  const trimmedContent = content.replace(/^\n+/, "");
  return trimmedContent ? `${frontMatter}${trimmedContent}` : frontMatter;
}
