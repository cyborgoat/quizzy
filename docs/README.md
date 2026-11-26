# Quizzy Documentation

Quizzy is a local-first desktop quiz application built with Tauri v2, React,
TypeScript, and Rust. It reads quiz files from a user-selected directory rather
than storing quiz content in a database. A persistent sidebar provides navigation
between Home, Mistake Log, Knowledge, History, optional QuizHub, and Settings.

On first launch, a short wizard sets language (English, Spanish, or Chinese),
working folder, and optional QuizHub. The Welcome quiz and note are written in
that language when missing.

## Documentation map

- [Quick start](quick-start.md): prerequisites, first launch, local development, and desktop builds
- [Features and workflows](features.md): sidebar, library, QuizHub, goals, Mistake Log, Knowledge, settings, sync, and reset
- [Software architecture](architecture.md): frontend, native layer, data flow, and project structure
- [Quiz JSON format](quiz-format.md): supported question types and validation rules
- [Knowledge file format](knowledge-format.md): markdown note front matter, linking rules, and folder layout
- [Native storage and security](native-storage.md): settings, app-config layout, QuizHub cache, and filesystem boundaries
- [Development and testing](development.md): scripts, tests, formatting, and packaging

Reference quiz files for development and manual quiz-folder testing are kept in
`sample-quizzes/`. Reference knowledge notes are in `sample-quizzes/knowledge-base/`.
English, Spanish, and Chinese Welcome samples are embedded and written for the
chosen app locale when a working directory is first set up (or via **Add welcome
sample** in the import guide).

## Technology stack

| Area | Technology |
| --- | --- |
| Desktop runtime | Tauri v2 |
| Native layer | Rust |
| Frontend | React 19 and TypeScript |
| Build tooling | Vite |
| Styling | Tailwind CSS v4 |
| UI primitives | shadcn-style local components |
| Routing | TanStack Router (file-based) |
| Validation | Zod |
| Markdown rendering | react-markdown, remark-gfm, remark-math, rehype-katex |
| Knowledge editing | MDXEditor (`@mdxeditor/editor`) — WYSIWYG markdown editor for notes |
| Toast notifications | Sonner |
| Frontend tests | Vitest |

## Design principles

- Quiz data remains in ordinary JSON files controlled by the user.
- The webview does not receive general filesystem access.
- Invalid quiz files are reported and skipped without crashing the app.
- Active quiz sessions use an in-memory snapshot and are not affected by
  subsequent file refreshes.
- Goal metadata and attempt history are persisted locally; in-progress quiz
  drafts are not.
- UI chrome is localized (English / Spanish / Chinese); quiz and note content stay as authored.
