# Quiz JSON Format

## File layout

The working directory is flat:

```text
my-quizzes/
  react-basics.json
  history.json
  safety-training.json
```

Each top-level `.json` file contains one quiz. The filename does not need to
match the quiz ID, but unique, descriptive filenames are recommended.

## Quiz object

```json
{
  "id": "react-basics",
  "title": "React Basics",
  "description": "Fundamental React concepts.",
  "tags": ["react", "frontend"],
  "questions": []
}
```

Fields:

| Field | Required | Rules |
| --- | --- | --- |
| `id` | Yes | Non-empty string; unique in the working directory |
| `title` | Yes | Non-empty string |
| `description` | No | Non-empty string when present |
| `tags` | No | Array of non-empty strings; defaults to `[]` |
| `questions` | Yes | At least one validated question |

Question IDs must be unique within the quiz.

## Single choice

```json
{
  "id": "q1",
  "type": "single_choice",
  "prompt": "Which hook stores local component state?",
  "options": ["useMemo", "useState", "useRef"],
  "answerIndex": 1,
  "explanation": "useState stores local component state."
}
```

Rules:

- At least two options
- `answerIndex` is a non-negative integer
- `answerIndex` must reference an existing option

## Multiple choice

```json
{
  "id": "q2",
  "type": "multiple_choice",
  "prompt": "Which are JavaScript primitive types?",
  "options": ["string", "number", "boolean", "array"],
  "answerIndices": [0, 1, 2],
  "explanation": "Arrays are objects."
}
```

Rules:

- At least two options
- At least one answer index
- Answer indices must be unique, non-negative integers
- Every answer index must reference an existing option
- The user must select the exact correct set; partial credit is not awarded

## True or false

```json
{
  "id": "q3",
  "type": "true_false",
  "prompt": "React components can return null.",
  "answer": true,
  "explanation": "Returning null renders nothing."
}
```

The `answer` field must be a JSON boolean, not the string `"true"` or `"false"`.

## Markdown in question content

The `prompt`, `options`, and `explanation` fields all support CommonMark
Markdown. Supported syntax:

| Syntax | Effect |
| --- | --- |
| `**text**` | Bold |
| `*text*` | Italic |
| `` `code` `` | Inline code |
| ` ```lang … ``` ` | Fenced code block |
| `$…$` | Inline math (KaTeX) |
| `$$…$$` | Display math (KaTeX) |

**Inline math:**

```json
{
  "id": "q1",
  "type": "single_choice",
  "prompt": "Solve for $x$: $2x + 4 = 10$",
  "options": ["$x = 2$", "$x = 3$", "$x = 5$"],
  "answerIndex": 1,
  "explanation": "Subtract 4: $2x = 6$, then divide: $x = 3$."
}
```

**Display math:**

```json
{
  "id": "q2",
  "type": "single_choice",
  "prompt": "Using:\n\n$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$\n\nSolve $x^2 - 5x + 6 = 0$.",
  "options": ["$x = 1$ or $x = 4$", "$x = 2$ or $x = 3$"],
  "answerIndex": 1
}
```

**Fenced code block:**

```json
{
  "id": "q3",
  "type": "single_choice",
  "prompt": "What does this log?\n\n```js\nconsole.log(typeof null);\n```",
  "options": ["`\"null\"`", "`\"object\"`", "`\"undefined\"`"],
  "answerIndex": 1,
  "explanation": "`typeof null` returns `\"object\"` — a long-standing JavaScript quirk."
}
```

See `sample-quizzes/markdown-showcase.json` for a complete file that exercises
every supported Markdown feature.

## Complete example

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

## Invalid files

Quizzy skips files that:

- Are unreadable
- Contain malformed JSON
- Fail any field or cross-field validation rule
- Reuse a quiz ID already loaded from another file

The home page displays the filename and validation issues. Detailed reports are
also logged to the developer console in development builds.

