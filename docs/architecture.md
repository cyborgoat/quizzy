# Software Architecture

## Overview

Quizzy separates desktop filesystem responsibilities from quiz-domain and UI
responsibilities:

```text
User
  |
React pages and components
  |
QuizLibraryProvider / useQuizSession
  |
Zod validation and scoring
  |
Typed Tauri invoke wrapper
  |
Rust commands
  |
Settings file and user working directory
```

The React webview never receives unrestricted filesystem plugin permissions.
Instead, it calls a small set of quiz-specific Rust commands.

## Frontend layers

### Application and routing

`src/main.tsx` mounts the library provider and router. Routes are defined in
`src/app/routes.tsx`:

| Route | Page |
| --- | --- |
| `/` | Quiz library and working-directory management |
| `/quiz/:quizId` | Active quiz or final results |

Unknown routes redirect to the home page.

### Library state

`QuizLibraryProvider` coordinates desktop storage with the UI. It owns:

- Working-directory path and availability
- Valid quiz sources
- Invalid-file reports
- Loading and notification state
- Directory selection, refresh, import, and deletion workflows

`parseQuizFiles` is the boundary between raw file contents and trusted quiz
objects. It parses JSON, applies the Zod schema, sorts files, and rejects
duplicate quiz IDs.

### Quiz session state

`useQuizSession` owns one in-memory attempt:

- Current question index
- Per-question editable answer drafts
- Independent per-question review flags
- Final submitted answer records
- Score and completion state

The reducer in `src/lib/quizSessionState.ts` makes navigation and attempt state
transitions deterministic and testable. The hook receives an already validated
`Quiz` object, while scoring remains delegated to pure functions.

### Presentation

Quiz components are split by responsibility:

- Library list and states
- Header and progress
- Question content and answer rows
- shadcn `Sidebar` question navigator with its responsive mobile sheet
- Previous/Next action bar and final-submit confirmation
- Result summary and answer review

The question page uses a wide reading layout. Cards are reserved for library
items, results, and status content. Its navigation layout is composed with
`SidebarProvider`, a left-side `Sidebar`, `SidebarInset`, and `SidebarTrigger`;
the sidebar primitive owns desktop collapse state, the mobile sheet, keyboard
toggle behavior, and focus management.

## Native layers

`src/lib/native.ts` is the typed frontend adapter for Tauri `invoke` calls.

`src-tauri/src/lib.rs` implements:

- Settings persistence
- Working-directory validation
- Top-level JSON scanning
- Reading files selected through the import dialog
- Atomic file writes and replacement
- Quiz deletion

The dialog plugin is used only to obtain user-selected paths. File operations are
performed by custom Rust commands.

## Data flow

### Application startup

1. React requests the saved working-directory state.
2. Rust loads `settings.json` from the Tauri app-config directory.
3. If the directory exists, Rust returns its top-level JSON files.
4. React parses and validates every file.
5. Valid quizzes are listed; invalid files become diagnostics.

### Import

1. The dialog plugin returns selected source paths.
2. Rust reads those source files.
3. React validates all candidate quizzes and plans conflicts.
4. The user confirms replacements if necessary.
5. React sends validated content and destination filenames to Rust.
6. Rust validates the destination filename and writes atomically.
7. React rescans the working directory.

### Quiz attempt

1. The route selects a validated quiz by ID.
2. `useQuizSession` stores editable drafts and flags for every question.
3. Direct, previous, and next navigation preserve those drafts.
4. Final submission freezes one answer record per question.
5. Pure scoring functions evaluate answered questions; blanks score as incorrect.
6. The frozen records drive the result and review screens.

## Project structure

```text
src/
  app/            Router configuration
  components/     Quiz UI and local UI primitives
  contexts/       Quiz library provider and context type
  data/           Zod schema, repository parser, and tests
  hooks/          Library and quiz-session hooks
  lib/            Native adapter, scoring, and utility functions
  pages/          Home and quiz routes
  types/          Quiz and answer domain types

src-tauri/
  capabilities/   Tauri permissions
  icons/          Desktop and mobile platform icons
  src/            Rust command implementation
  Cargo.toml      Rust dependencies and crate configuration
  tauri.conf.json Desktop window, build, and bundle configuration

sample-quizzes/    Reference quiz JSON files for manual import and testing
```
