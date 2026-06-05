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

Run them with:

```bash
npm test
```

## Rust tests

Native tests cover:

- Rejection of path traversal and non-JSON destination filenames
- Explicit overwrite requirements
- Successful atomic replacement

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
- Attempt state: `src/hooks/useQuizSession.ts`
- Library workflow: `QuizLibraryProvider`
- Filesystem behavior: typed native adapter plus a Rust command
- Presentation: a focused component under `src/components`

Add tests at the domain boundary affected by the change. Filesystem changes
should have Rust tests; validation and scoring changes should have Vitest tests.

## Release checklist

Before packaging a release:

1. Run `npm test`.
2. Run `npm run lint`.
3. Run `npm run build`.
4. Run Rust tests and formatting checks.
5. Run a no-bundle Tauri build.
6. Build platform installers with `npm run tauri build`.
7. Test directory selection, imports, replacement, deletion, and quiz completion
   in the packaged application.

The files under `sample-quizzes/` can be selected through the normal import
dialog when manual test data is needed. They are not production resources.
