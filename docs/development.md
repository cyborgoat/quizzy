# Development and Testing

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
- Mistake Log aggregation, threshold filtering, sorting, and empty-state detection
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

Run:

```bash
cargo test --manifest-path src-tauri/Cargo.toml
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
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
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
- Attempt state and session modes: `src/hooks/useQuizSession.ts` and
  `src/types/quizSession.ts`
- Library workflow: `QuizLibraryProvider`
- Goals workflow: `GoalsProvider` and `src/components/goals`
- Mistake Log workflow: `useMistakeLog`, `src/lib/mistakeLog.ts`,
  `src/lib/mistakeLogReview.ts`, `QuestionReviewCard`, and
  `src/pages/MistakeLogPage.tsx`
- Knowledge Base workflow: `KnowledgeLibraryProvider`, `src/lib/knowledgeDraft.ts`,
  and `src/components/knowledge`
- Route configuration: `src/routes/` (generates `src/routeTree.gen.ts`)
- Filesystem behavior: typed native adapter plus a Rust command
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
4. Run `cargo test --manifest-path src-tauri/Cargo.toml` and Rust formatting checks.
5. Run a no-bundle Tauri build.
6. Build platform installers with `npm run tauri build`.
7. Test directory selection, opening and rescanning the quiz folder, practice
   and scored quiz completion, goal creation, attempt recording, attempt
   deletion, attempt review, Mistake Log threshold filtering and question
   review, and Knowledge Base note create/edit/link/preview in the packaged
   application.

The files under `sample-quizzes/` and `sample-knowledge/` can be copied into
your working directory when manual test data is needed. They are not production
resources.

Cross-platform release builds are handled by `.github/workflows/release.yml` when
a version tag is pushed.
