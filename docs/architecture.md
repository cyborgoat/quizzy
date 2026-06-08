# Software Architecture

## Overview

Quizzy separates desktop filesystem responsibilities from quiz-domain and UI
responsibilities:

```text
User
  |
React pages and components
  |
UserProfileProvider / QuizLibraryProvider / GoalsProvider / useQuizSession
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

`src/main.tsx` mounts the provider tree and `RouterProvider`. Routes are
file-based under `src/routes/` and compiled into `src/routeTree.gen.ts` by the
TanStack Router Vite plugin. Router bootstrap lives in `src/app/router.tsx`.

| Route | Page |
| --- | --- |
| `/` | Quiz library (home page) |
| `/goals` | Goal tracking |
| `/goals/:goalId/attempts/:attemptId` | Attempt review |
| `/settings` | User profile and working-directory configuration |
| `/quiz/:quizId` | Active quiz or final results (`?mode=practice&count=N` or `?mode=scored`) |

Unknown routes redirect to the home page.

`/` through `/settings` share `AppLayout`, which wraps those pages in a
`SidebarProvider`, renders `AppSidebar` (the persistent navigation sidebar), and
exposes the page content area via TanStack Router's `<Outlet />`. The
`/quiz/:quizId` route is non-nested at the root so it renders full-screen with
its own `SidebarProvider` for the question navigator.

### User profile state

`UserProfileProvider` stores the user's display name in `localStorage` under the
key `quizzy:profile:name`. It exposes `userName` and `setUserName` through the
`UserProfileContext`. No Tauri backend is involved; the value is read
synchronously on mount via a lazy `useState` initializer.

`useUserProfile` is the hook consumers call to read or update the name.

### Library state

`QuizLibraryProvider` coordinates desktop storage with the UI. It owns:

- Working-directory path and availability
- Valid quiz sources
- Invalid-file reports
- Loading state
- Refresh, import, and deletion workflows

Operations that complete asynchronously — import, deletion, refresh, and
directory application — call `toast.success` or `toast.error` from Sonner
directly rather than updating a local notice state.

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

The app uses two independent sidebar contexts:

**App layout** (`AppLayout` + `AppSidebar`): wraps the home, goals, and settings
pages. The sidebar is collapsible to icon-only mode and contains Home and Goals
navigation in the content area and Settings navigation pinned to the footer.

**Quiz page** (`QuizPage`): wraps the active quiz in its own `SidebarProvider`.
The left sidebar (`QuizQuestionSidebar`) shows the question navigator; on mobile
it opens as an off-canvas sheet. The header shows the quiz title, question
counter, and answered-count progress bar. Previous and Next buttons appear inline
below each question. The sticky footer holds Home (exit) and Submit quiz.

Both sidebars use the same shadcn `Sidebar` primitive. The primitive owns desktop
collapse state, the mobile sheet, keyboard toggle (`Cmd+B` / `Ctrl+B`), and focus
management.

Other quiz components are split by responsibility:

- Library list and states
- Question content and answer rows
- Result summary and answer review

Goal components cover accordion goal cards, attempt history, score summaries,
and the dedicated attempt review page layout.

### Goals state

`GoalsProvider` loads goals and attempt summaries from the native layer on
startup. It exposes CRUD operations for goals and persists completed attempts
when a quiz submission matches one or more goals. Full attempt payloads (including
per-question results) are loaded on demand for the attempt review page.

`useGoals` is the hook consumers call to read or update goals.

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

### Settings save

1. The user edits their name and/or picks a new directory in `SettingsPage`.
2. Changes are staged in local component state; nothing is written yet.
3. Clicking Save commits the name to `localStorage` via `UserProfileProvider`.
4. If a new directory was staged, React calls `nativeApi.setWorkingDirectory`,
   then rescans the working directory.
5. A success toast confirms the save.

### Import

1. The dialog plugin returns selected source paths.
2. Rust reads those source files.
3. React validates all candidate quizzes and plans conflicts.
4. The user confirms replacements if necessary.
5. React sends validated content and destination filenames to Rust.
6. Rust validates the destination filename and writes atomically.
7. React rescans the working directory.

### Quiz attempt

1. The user opens `/quiz/:quizId` and picks **Practice** or **Scored attempt** on
   `QuizStartScreen`. Practice passes `?mode=practice&count=N`; scored passes
   `?mode=scored`.
2. `useQuizSession` loads the ordered question list (first N for practice, all
   for scored).
3. Editable drafts and flags are stored per question.
4. Direct, previous, and next navigation preserve those drafts.
5. Final submission freezes one answer record per question in the session.
6. Pure scoring functions evaluate answered questions; blanks score as incorrect.
7. The frozen records drive the result and review screens.
8. If the session mode is **scored** and the quiz matches any goals,
   `GoalsProvider` saves an attempt for each.

### Attempt review

1. The user opens `/goals/:goalId/attempts/:attemptId`.
2. React loads the goal metadata from context and fetches the full attempt from
   Rust via `get_goal_attempt`.
3. The page renders score summary, attempt history, and inline question review.

### Delete attempt

1. The user deletes an attempt from a goal row on the Goals page.
2. React calls `delete_goal_attempt` via the native adapter.
3. Rust removes the attempt file and updates `attempts/index.json`.
4. `GoalsProvider` updates in-memory goal state.

## Project structure

```text
src/
  app/            Router bootstrap (`createRouter`)
  routes/         File-based TanStack Router route definitions
  components/
    layout/       AppLayout and AppSidebar (persistent navigation)
    goals/        Goal cards, attempt review, and history panels
    quiz/         Quiz UI components (including QuizStartScreen)
    ui/           shadcn-style local primitives (including Slider)
  contexts/       QuizLibraryProvider, GoalsProvider, UserProfileProvider
  data/           Zod schema, repository parser, and tests
  hooks/          useGoals, useQuizLibrary, useQuizSession, useUserProfile
  lib/            Native adapter, scoring, and utility functions
  pages/          HomePage, GoalsPage, AttemptReviewPage, SettingsPage, QuizPage
  types/          Quiz, goal, and quiz session domain types

src-tauri/
  capabilities/   Tauri permissions
  icons/          Desktop and mobile platform icons
  src/            Rust command implementation
  Cargo.toml      Rust dependencies and crate configuration
  tauri.conf.json Desktop window, build, and bundle configuration

sample-quizzes/    Reference quiz JSON files for manual import and testing
```
