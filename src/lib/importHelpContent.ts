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

export const FORMAT_RULES: { field: string; rule: string }[] = [
  { field: "id", rule: "Required. Must be unique across all quiz files." },
  { field: "title", rule: "Required." },
  { field: "description, tags", rule: "Optional. Tags is a list of strings." },
  { field: "questions", rule: "At least one. Question ids must be unique within the quiz." },
  {
    field: "single_choice",
    rule: "options (2 or more) and answerIndex (0-based index of the correct option).",
  },
  {
    field: "multiple_choice",
    rule: "options (2 or more) and answerIndices (unique 0-based indexes). Scored as an exact match.",
  },
  { field: "true_false", rule: "answer is true or false." },
  {
    field: "every question",
    rule: "id, type and prompt are required; explanation is optional. Text supports Markdown, tables, code blocks and KaTeX math.",
  },
];

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
