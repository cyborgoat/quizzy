import type { MessageKey } from "@/lib/i18n-messages";

export const EXAMPLE_QUIZ_JSON = `{
  "id": "web-basics",
  "title": "Web Basics",
  "description": "A short mixed-format quiz.",
  "tags": ["web"],
  "questions": [
    {
      "id": "q1",
      "type": "single_choice",
      "prompt": "Which language styles web pages?",
      "options": ["HTML", "CSS", "SQL"],
      "answerIndex": 1
    },
    {
      "id": "q2",
      "type": "multiple_choice",
      "prompt": "Which run in a browser frontend?",
      "options": ["HTML", "CSS", "JavaScript", "PostgreSQL"],
      "answerIndices": [0, 1, 2]
    },
    {
      "id": "q3",
      "type": "true_false",
      "prompt": "JSON supports comments.",
      "answer": false,
      "explanation": "Standard JSON syntax does not include comments."
    }
  ]
}`;

export const FORMAT_RULES: {
  field?: string;
  fieldKey?: MessageKey;
  ruleKey: MessageKey;
}[] = [
  { field: "id", ruleKey: "import.rule.id" },
  { field: "title", ruleKey: "import.rule.title" },
  { field: "description, tags", ruleKey: "import.rule.descriptionTags" },
  { field: "questions", ruleKey: "import.rule.questions" },
  { field: "single_choice", ruleKey: "import.rule.single_choice" },
  { field: "multiple_choice", ruleKey: "import.rule.multiple_choice" },
  { field: "true_false", ruleKey: "import.rule.true_false" },
  { fieldKey: "import.rule.everyQuestionField", ruleKey: "import.rule.everyQuestion" },
];

/** Sent to an AI assistant, so it stays in English regardless of the UI language. */
export const AI_PROMPT_TEMPLATE = `Create a quiz about {topic} as a single JSON file for the Quizzy app.

Rules:
- Output only valid JSON (no comments, no trailing commas, no surrounding prose).
- Top-level fields: "id" (unique kebab-case string), "title", optional "description", optional "tags" (array of strings), and "questions" (at least 1).
- Every question needs "id" (unique within the quiz), "type", "prompt", and optionally "explanation". Text may use Markdown and KaTeX math.
- Question types:
  - "single_choice": "options" (2 or more strings) and "answerIndex" (0-based integer).
  - "multiple_choice": "options" (2 or more strings) and "answerIndices" (unique 0-based integers).
  - "true_false": "answer" (boolean).
- Write 10 questions with a mix of types, each with a short explanation.

Example of the exact format:

${EXAMPLE_QUIZ_JSON}`;
