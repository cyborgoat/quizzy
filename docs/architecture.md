# Software Architecture

## Overview

Quizzy separates desktop filesystem responsibilities from quiz-domain and UI
responsibilities:

```text
User
  |
React pages and components
  |
UserProfileProvider / QuizPreferencesProvider / MistakeLogSettingsProvider /
QuizLibraryProvider / KnowledgeLibraryProvider / GoalsProvider / useQuizSession
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
| `/mistakes` | Mistake Log (`?quizId=` scopes to one quiz) |
| `/knowledge` | Knowledge Base browse view |
| `/knowledge/:knowledgeId` | Knowledge note detail (`?edit=1` opens edit mode) |
| `/settings` | User profile, preferences, and working-directory configuration |
| `/quiz/:quizId` | Active quiz or final results (`?mode=practice&count=N` or `?mode=scored`) |

Unknown routes redirect to the home page.

`/` through `/settings` share `AppLayout`, which wraps those pages in a
`SidebarProvider`, renders `AppSidebar` (the persistent navigation sidebar), and
exposes the page content area via TanStack Router's `<Outlet />`. The
`/quiz/:quizId` route is non-nested at the root so it renders full-screen with
its own `SidebarProvider` for the question navigator.

### User profile and preferences state

`UserProfileProvider` and `QuizPreferencesProvider` load profile name and split
shuffle preferences (question order and option order) from `settings.json` via
`loadAppSettings`. `MistakeLogSettingsProvider`
loads Mistake Log threshold settings from the same file. Settings changes are
committed through `nativeApi.saveSettings` on the Settings page; providers update
their in-memory state after a successful save.

`useUserProfile`, `useQuizPreferences`, and `useMistakeLogSettings` are the hooks
consumers call to read or update these values.

### Library state

`QuizLibraryProvider` coordinates desktop storage with the UI. It owns:

- Working-directory path and availability
- Valid quiz sources
- Invalid-file reports
- Loading state
- Refresh and folder-opening workflows

Operations that complete asynchronously — refresh, folder opening, and
directory application — call `toast.success` or `toast.error` from Sonner
directly rather than updating a local notice state.

`parseQuizFiles` is the boundary between raw file contents and trusted quiz
objects. It parses JSON, applies the Zod schema, sorts files, and rejects
duplicate quiz IDs.

### Knowledge library state

`KnowledgeLibraryProvider` owns the `knowledge-base` subfolder scan, valid note
items, invalid-file reports, and create/save/delete workflows. Notes are parsed
from YAML front matter plus a markdown body. Unsaved drafts live in session
storage via `knowledgeDraft.ts` until the user saves a new note.

`useKnowledgeLibrary` and `useKnowledgeIndex` expose library items and a
question-to-notes index for the Mistake Log and linked-question previews.

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

**App layout** (`AppLayout` + `AppSidebar`): wraps the home, goals, Mistake Log,
Knowledge Base, and settings pages. The sidebar is collapsible to icon-only mode
and contains Home, Goals, Mistake Log, and Knowledge navigation in the content
area and Settings navigation pinned to the footer.

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

Goal components cover shared add/edit dialogs, accordion goal cards, attempt
history, score summaries, and the dedicated attempt review page layout. Quiz
cards reuse the goal dialogs so goal changes do not require navigation.

Knowledge components cover note browse/detail views, edit and link dialogs,
linked-question preview, clipboard export, and shared linked-notes lists reused
by the Mistake Log inline review card. Secondary actions use `IconActionButton` with
tooltips.

### Goals state

`GoalsProvider` loads goals and attempt summaries from the native layer on
startup. It exposes CRUD operations for goals, enforces one goal per quiz in the
frontend, and persists completed attempts when a quiz submission matches a goal.
Full attempt payloads (including per-question results) are loaded on demand for
the attempt review page only.

The native `upsert_goal` command independently enforces the one-goal-per-quiz
invariant so callers cannot bypass it.

`useMistakeLog` loads the materialized mistake index from Rust in one IPC call,
applies Mistake Log thresholds, and sorts mistakes by frequency. Rust keeps the
index up to date when attempts are saved or deleted. The hook reloads when goals
change and performs a background refresh when the app window regains focus.

`useGoals` is the hook consumers call to read or update goals.

## Native layers

`src/lib/native.ts` is the typed frontend adapter for Tauri `invoke` calls.

`src-tauri/src/lib.rs` implements settings, working-directory validation,
top-level JSON scanning, and opening the configured quiz directory in the system
file manager. Goal and attempt persistence live in `goals_storage.rs`. The
materialized Mistake Log index lives in `mistake_index.rs`.

The dialog plugin obtains the working-directory path in Settings. Quiz files are
managed directly through the system file manager.

## Data flow

### Application startup

1. React requests the saved working-directory state.
2. Rust loads `settings.json` from the Tauri app-config directory.
3. If the directory exists, Rust returns its top-level JSON files.
4. React parses and validates every file.
5. Valid quizzes are listed; invalid files become diagnostics.

### Settings save

1. The user edits profile, preferences, Mistake Log thresholds, and/or picks a
   new directory in `SettingsPage`.
2. Changes are staged in local component state; nothing is written yet.
3. Clicking Save validates inputs and calls `nativeApi.saveSettings`.
4. Providers update in-memory state for profile, shuffle preferences, and Mistake Log
   thresholds.
5. If a new directory was staged, React rescans the working directory.
6. A success toast confirms the save.

### Open quiz folder

1. The user clicks **Open quiz folder**.
2. React invokes the native `open_quiz_folder` command without passing a path.
3. Rust resolves and validates the configured working directory.
4. Rust opens that directory with the platform file manager.
5. Quizzy rescans when the application regains focus or the user clicks
   **Refresh**.

### Quiz attempt

1. The user opens `/quiz/:quizId` and picks **Practice** or **Scored attempt** on
   `QuizStartScreen`. Practice passes `?mode=practice&count=N`; scored passes
   `?mode=scored`.
2. `useQuizSession` selects a type-balanced subset for practice (or all questions
  for scored), then applies question-order and option-order shuffle settings.
3. Editable drafts and flags are stored per question.
4. Direct, previous, and next navigation preserve those drafts.
5. Final submission freezes one answer record per question in the session.
6. Pure scoring functions evaluate answered questions; blanks score as incorrect.
7. The frozen records drive the result and review screens.
8. If the session mode is **scored** and the quiz has a goal,
   `GoalsProvider` saves an attempt for it.
9. Rust updates `mistake-index.json` for that quiz when the attempt is saved.

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
5. Rust updates `mistake-index.json` for that goal's quiz.
6. The Mistake Log reloads the index when goals change.

### Mistake Log review

1. The user opens `/mistakes` or `/mistakes?quizId=...`.
2. `useMistakeLog` loads `mistake-index.json` via `get_mistake_index`.
3. Entries are filtered by configured thresholds, with flagged questions always
  included, and sorted by flagged count then mistake frequency.
4. The first sorted row is selected by default. Clicking a row or using arrow
   navigation selects an entry in `QuestionReviewCard` below the table.
   The card loads the live question definition from the quiz library and shows
   review UI with the most recent incorrect answer. Linked knowledge notes reuse
   `QuestionKnowledgeNotesPanel` via `ReviewQuestionSplitPanel`.
5. Column-header dropdowns filter by quiz name and question type. The mistake
   list section can be collapsed while review navigation continues.

### Manual data synchronization

1. The user opens **Settings** and clicks **Synchronize data**.
2. A confirmation dialog explains that quiz/knowledge files are not modified.
3. Rust runs `synchronize_app_data`: rescans the working directory and knowledge
   base, repairs goal attempt indexes, updates goal titles from quiz files when
   needed, and rebuilds `mistake-index.json` when its contents change.
4. React refreshes the working-directory state, quiz library, knowledge library,
   and goals (clearing the attempt cache) so Mistake Log and Goals stay aligned.
5. Settings shows a result card with rescanned counts, repairs, changed file
   paths, and any warnings.

### Knowledge note workflow

1. The user opens `/knowledge` or a note from the Mistake Log review card.
2. React loads note metadata from `KnowledgeLibraryProvider` or a session draft.
3. Edit mode uses **MDXEditor** for WYSIWYG markdown authoring (tables, lists,
   code blocks, links). Math (`$…$`, `$$…$$`) is typed as markdown and rendered
   in view mode. View mode renders markdown through `MarkdownContent` (remark-gfm,
   remark-math, rehype-katex).
4. Clicking a linked-question chip opens `LinkedQuestionPreviewDialog` without
   changing routes.
5. Saving writes the `.md` file through native commands and refreshes the library.

## Project structure

```text
src/
  app/            Router bootstrap (`createRouter`)
  routes/         File-based TanStack Router route definitions
  components/
    knowledge/    Note editor, viewer, link/preview dialogs, linked-notes list
    layout/       AppLayout and AppSidebar (persistent navigation)
    goals/        Goal cards, attempt review, and history panels
    quiz/         Quiz UI, QuestionReviewCard, ReviewQuestionSplitPanel
    ui/           shadcn-style local primitives (including Drawer and Slider)
  contexts/       QuizLibraryProvider, KnowledgeLibraryProvider, GoalsProvider,
                  preferences providers
  data/           Zod schema, repository parser, and tests
  hooks/          useGoals, useMistakeLog, useKnowledgeLibrary, useQuizSession, etc.
  lib/            Native adapter, scoring, knowledge drafts, mistake threshold
                  filtering, syncReport (sync result formatting),
                  mistakeLogReview (answer remap and table page sync)
  pages/          HomePage, GoalsPage, MistakeLogPage, KnowledgeBasePage, etc.
  test/           Vitest setup (browser API polyfills for Node)
  types/          Quiz, goal, knowledge, mistake log, and quiz session types

src-tauri/
  capabilities/   Tauri permissions
  icons/          Desktop and mobile platform icons
  src/            Rust commands (`lib.rs`, `goals_storage.rs`, `mistake_index.rs`,
                  `data_sync.rs`)
  Cargo.toml      Rust dependencies and crate configuration
  tauri.conf.json Desktop window, build, and bundle configuration

sample-quizzes/    Reference quiz JSON files for manual folder testing
sample-knowledge/  Reference knowledge `.md` files for manual folder testing
```
