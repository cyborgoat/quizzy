# Quizzy Documentation

Quizzy is a local-first desktop quiz application built with Tauri v2, React,
TypeScript, and Rust. It reads quiz files from a user-selected directory rather
than storing quiz content in a database. A persistent sidebar provides navigation
between the home page, goals, Mistake Log, and Settings, where users configure
their display name, quiz preferences, Mistake Log thresholds, and working directory.

## Documentation map

- [Quick start](quick-start.md): prerequisites, local development, and desktop builds
- [Features and workflows](features.md): sidebar, goals, Mistake Log, practice and scored quiz modes, settings, imports, and review
- [Software architecture](architecture.md): frontend, native layer, data flow, and project structure
- [Quiz JSON format](quiz-format.md): supported question types and validation rules
- [Native storage and security](native-storage.md): settings, filesystem boundaries, and atomic writes
- [Development and testing](development.md): scripts, tests, formatting, and packaging

Reference quiz files for development and manual import testing are kept in
`sample-quizzes/`. They are not bundled with the desktop application.

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
| Markdown rendering | react-markdown, remark-math, rehype-katex |
| Toast notifications | Sonner |
| Frontend tests | Vitest |

## Design principles

- Quiz data remains in ordinary JSON files controlled by the user.
- The webview does not receive general filesystem access.
- Invalid quiz files are reported and skipped without crashing the app.
- Active quiz sessions use an in-memory snapshot and are not affected by
  subsequent file refreshes.
- Goal metadata and attempt history are persisted locally; in-progress quiz
  drafts and practice runs are not.
