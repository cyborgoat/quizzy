# Quizzy

Quizzy is a Tauri v2 desktop quiz application. It reads validated quiz JSON files
from a user-selected working directory, tracks study goals with saved attempt
history, and keeps quiz data entirely local.

Detailed documentation is available in [docs/README.md](docs/README.md).

Example JSON quizzes are in [sample-quizzes](sample-quizzes). Example knowledge
notes are in [sample-knowledge](sample-knowledge). Copy them into your working
directory when testing locally. They are not bundled into production builds.

## Requirements

- Node.js and npm
- Rust stable toolchain
- Tauri platform prerequisites for your operating system

## Development

```bash
npm install
npm run tauri dev
```

Frontend-only checks:

```bash
npm test
npm run lint
npm run build
cargo test --manifest-path src-tauri/Cargo.toml
```

Create desktop installers with:

```bash
npm run tauri build
```

## First launch

On first launch, open **Settings** from the sidebar to enter your name and select
a working directory. Click **Save**, then return to the home page and use
**Open quiz folder** to add quiz JSON files directly. Use **Goals** in the
sidebar to set target scores and review past attempts. You can also use the
target icon on a quiz card to add or edit that quiz's single goal without
leaving the home page. Existing goal icons provide quick access to attempts,
the quiz-scoped Mistake Log, and goal deletion. Use **Knowledge** in the sidebar
to browse markdown notes linked to quiz questions. Use **Mistake Log** to review
questions you miss most often and flagged questions from scored attempts, with
inline question review, column filters, and linked knowledge notes.

When you start a quiz, choose **Practice** (subset of questions, not saved to
goals) or **Scored attempt** (full quiz, counts toward goals and the Mistake Log).

## Quiz files

The configured working directory uses a flat layout. Each top-level `.json` file
contains one quiz. Quizzy validates files on load, skips invalid files, and shows
diagnostics without crashing.

Use **Open quiz folder** on the home page to manage quiz files with the system
file manager, then click **Refresh** or return focus to Quizzy to rescan them.
