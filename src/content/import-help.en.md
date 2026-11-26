## How to import

1. **Import a file** — use **Import a file now** above, pick a `.json` quiz, and Quizzy copies it into your quiz folder.
2. **Drop into the folder** — open the quiz folder, add `.json` files at the top level, then press **Refresh** on Home. Nested folders are ignored.

If a file does not appear, check the red notice on Home. Common causes: invalid JSON, a missing required field, or a quiz `id` already used by another file.

## Generate with AI

Use **Copy prompt** (top right), paste it into any LLM agent, replace `{topic}` with your subject, and save the reply as a `.json` file. Then import it.

## File format

Each top-level `.json` file is one quiz.

| Field | Rules |
| --- | --- |
| `id` | Required. Unique across all quiz files. |
| `title` | Required. |
| `description`, `tags` | Optional. `tags` is a list of strings. |
| `questions` | At least one. Question `id`s must be unique within the quiz. |

Every question needs `id`, `type`, and `prompt`. `explanation` is optional. Text supports Markdown, tables, code blocks, and KaTeX math.

### Question types

- **`single_choice`** — `options` (2+) and `answerIndex` (0-based).
- **`multiple_choice`** — `options` (2+) and `answerIndices` (unique 0-based indexes). Scored as an exact match.
- **`true_false`** — `answer` is `true` or `false`.

### Example

```json
{
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
}
```
