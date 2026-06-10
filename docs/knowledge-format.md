# Knowledge file format

Knowledge notes are stored as `.md` files inside a `knowledge-base` subfolder of the configured working directory. Quiz `.json` files remain at the top level of the working directory.

## File layout

Each file contains YAML front matter followed by a markdown body:

```markdown
---
id: react-useeffect-cleanup
title: useEffect cleanup patterns
tags:
  - react
  - hooks
linkedQuizQuestions:
  - quizId: react-basics
    questionId: useeffect-cleanup
createdAt: 2026-06-09T10:00:00.000Z
updatedAt: 2026-06-09T10:00:00.000Z
---

## Key idea

Always return a cleanup function when subscribing to external resources.
```

## Front matter fields

| Field | Required | Description |
| --- | --- | --- |
| `id` | Yes | Stable identifier. Must match the filename stem (`react-useeffect-cleanup` for `react-useeffect-cleanup.md`). |
| `title` | Yes | Display title shown in the Knowledge Base and Mistake Log drawer. |
| `tags` | No | Free-form labels used for filtering. |
| `linkedQuizQuestions` | No | Question-level links to quiz content. Each entry contains `quizId` and `questionId`. |
| `createdAt` | Yes | ISO 8601 timestamp set when the note is created. |
| `updatedAt` | Yes | ISO 8601 timestamp updated on each save. |

## Linking rules

- Links are one-way: knowledge notes reference quiz questions.
- Multiple notes may link to the same question.
- Linked questions appear in the Mistake Log table and review drawer.
- If a linked quiz or question is missing from the current library, Quizzy shows a warning but still displays the note.

## Markdown body

The body supports the same markdown syntax used in quiz content:

- **bold**, *italic*, `inline code`
- fenced code blocks
- GFM pipe tables
- KaTeX math with `$...$` and `$$...$$`

## Viewing linked questions

From a knowledge note, click a linked-question chip to open a preview dialog. The
dialog shows the quiz title and description, the question prompt and options, a
**Show answer** toggle, related knowledge notes for that question, and links to
open other notes without leaving your current context.

## Storage location

```
<workingDirectory>/
  quiz-file.json
  knowledge-base/
    my-note.md
```

Quizzy auto-creates the `knowledge-base` folder on first note creation or scan.

## External editing

You can edit `.md` files directly in the `knowledge-base` folder. Quizzy rescans knowledge files when the Knowledge Base page refreshes and when the app window regains focus.
