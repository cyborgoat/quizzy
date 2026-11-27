# Development and Testing

## Environment

Copy `.env.example` to `.env` and set `QUIZHUB_DEFAULT_BASE_URL` to the default
QuizHub catalog URL. The Rust build injects this value at compile time; it is not
hardcoded in source. Release builds fail if it is missing. Dev and `cargo test`
builds use a local placeholder when unset.

GitHub Releases set the same variable from the `QUIZHUB_DEFAULT_BASE_URL`
repository secret.

## npm scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite frontend |
| `npm run build` | Type-check and build frontend assets |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest once |
| `npm run preview` | Preview the built frontend |
| `npm run tauri dev` | Run the complete desktop app |
| `npm run tauri build` | Build desktop installers |

## Frontend tests

Tests currently cover:

- Default quiz tags
- Out-of-range and duplicate answer indices
- Duplicate question IDs
- Malformed files
- Duplicate quiz IDs and filenames
- Unreadable-file diagnostics
- Exact-set multiple-choice scoring
- No partial credit
- Answer and flag persistence across direct navigation
- Navigation boundary handling
- Early submission with unanswered questions
- Frozen submitted results and complete restart behavior
- Mistake Log threshold filtering, sorting, and empty-state detection (aggregation
  is covered by Rust `mistake_index` tests)
- Knowledge note drafts, front matter parsing, link validation, question label formatting, linked-question lookup, and clipboard export

Vitest loads `src/test/setup.ts` to polyfill browser APIs such as `sessionStorage`
when tests run in Node (including CI).

Run them with:

```bash
npm test
```

## Rust tests

Native tests cover:

- JSON extension and UTF-8 BOM handling
- Atomic settings writes
- Goal and attempt persistence invariants
- Mistake index aggregation, rebuild, and staleness detection
- Data sync attempt-index repair, goal title alignment, and sync report counts

Run from the Rust crate directory:

```bash
cd src-tauri && cargo test
```

If a local Rust installation has broken Cargo shims but the stable toolchain
binaries remain installed, repair the Rust installation rather than committing
machine-specific absolute paths to project scripts.

## Formatting and linting

Frontend:

```bash
npm run lint
```

Rust:

```bash
cd src-tauri && cargo fmt -- --check
```

## Integration verification

Use a no-bundle debug build to verify that Vite assets and the Rust application
compile together:

```bash
npm run tauri build -- --debug --no-bundle
```

This produces a platform executable under `src-tauri/target/debug/`.

## Adding a feature

Use the narrowest appropriate layer:

- Quiz data shape or validation: `src/types` and `src/data`
- Pure scoring behavior: `src/lib/scoring.ts`
- Attempt state: `src/hooks/useQuizSession.ts`
- Library workflow: `QuizLibraryProvider`
- Goals workflow: `GoalsProvider` and `src/components/goals`
- Mistake Log workflow: `useMistakeLog`, `useMistakeLogPageState`,
  `src/lib/mistakeLog.ts`, `src/lib/mistakeLogDisplay.ts`,
  `src/lib/mistakeLogReview.ts`, `src/components/mistake-log/`,
  `QuestionReviewCard`, and `src/pages/MistakeLogPage.tsx`
- Knowledge Base workflow: `KnowledgeLibraryProvider`, `src/lib/knowledgeDraft.ts`,
  and `src/components/knowledge`
- Settings workflow: `useSettingsPageState`, `src/lib/settingsDraft.ts`,
  `src/components/settings/`, and `src/pages/SettingsPage.tsx`
- First-launch wizard: `FirstLaunchWizard` / onboarding steps, gated by
  `onboardingCompleted` in settings
- Localization: `src/lib/i18n.ts`, `src/lib/i18n-messages.ts`, `I18nProvider`
- QuizHub: `src/routes/_app/hub.tsx`, `src/pages/QuizhubPage.tsx`,
  `src/components/quizhub/`, and `src-tauri/src/hub_sync.rs`
- Reset: `useSettingsReset` and `src-tauri/src/data_reset.rs`
- Route configuration: `src/routes/` (generates `src/routeTree.gen.ts`)
- Filesystem behavior: typed native adapter plus a Rust command (goal, mistake
  index, and manual sync are handled in `src-tauri/src/goals_storage.rs`,
  `src-tauri/src/mistake_index.rs`, and `src-tauri/src/data_sync.rs`)
- Presentation: a focused component under `src/components`

Add tests at the domain boundary affected by the change. Filesystem changes
should have Rust tests; validation and scoring changes should have Vitest tests.

When adding a route, create a file under `src/routes/` following TanStack Router
file-based conventions. The Vite plugin regenerates `src/routeTree.gen.ts`
automatically; do not edit that file by hand.

## Release checklist

Before packaging a release:

1. Run `npm test`.
2. Run `npm run lint`.
3. Run `npm run build`.
4. Run `cd src-tauri && cargo test` and Rust formatting checks.
5. Run a no-bundle Tauri build.
6. Build platform installers with `npm run tauri build`.
7. Smoke-test first-launch (language → folder → QuizHub → complete), locale
   switch, Welcome seeding, QuizHub browse/download when enabled, directory
   rescan, quiz completion, goals and History, Mistake Log, Knowledge notes,
   Settings sync, and leveled Reset in the packaged application.

The files under `sample-quizzes/` (and `sample-quizzes/knowledge-base/`) can be
copied into your working directory when manual test data is needed. Locale-matched
Welcome quiz and note assets are embedded and written when a working directory is
set up (or via **Add welcome sample**).

Cross-platform release builds are handled by `.github/workflows/release.yml` when
a version tag is pushed.
