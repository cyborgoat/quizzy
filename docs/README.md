# Quizzy Documentation

Quizzy is a local-first desktop quiz application built with Tauri v2, React,
TypeScript, and Rust. It reads quiz files from a user-selected directory rather
than storing quiz content in a database. A persistent sidebar provides navigation
between the home page and the Settings page, where users configure their display
name and working directory.

## Documentation map

- [Quick start](quick-start.md): prerequisites, local development, and desktop builds
- [Features and workflows](features.md): sidebar, settings, working directories, imports, quiz sessions, and review
- [Software architecture](architecture.md): frontend, native layer, data flow, and project structure
- [Quiz JSON format](quiz-format.md): supported question types and validation rules
- [Native storage and security](native-storage.md): settings, filesystem boundaries, and atomic writes
- [Development and testing](development.md): scripts, tests, formatting, and packaging
- [GitHub releases](github-releases.md): automatic cross-platform release publishing

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
| Toast notifications | Sonner |
| Frontend tests | Vitest |

## Design principles

- Quiz data remains in ordinary JSON files controlled by the user.
- The webview does not receive general filesystem access.
- Invalid quiz files are reported and skipped without crashing the app.
- Active quiz sessions use an in-memory snapshot and are not affected by
  subsequent file refreshes.
- Scores and progress are intentionally not persisted.
