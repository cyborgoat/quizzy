# Quizzy

Quizzy is a Tauri v2 desktop quiz application. It reads validated quiz JSON files
from a user-selected working directory and keeps quiz data entirely local.

Detailed documentation is available in [docs/README.md](docs/README.md).

Example JSON quizzes are available in [sample-quizzes](sample-quizzes) for
manual import and format reference. They are not bundled into production builds.

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
```

Create desktop installers with:

```bash
npm run tauri build
```

## First launch

On first launch, open **Settings** from the sidebar to enter your name and select
a working directory. Click **Save**, then return to the home page to import quiz
files and get started.

## Quiz files

The configured working directory uses a flat layout. Each top-level `.json` file
contains one quiz. Quizzy validates files on load, skips invalid files, and shows
diagnostics without crashing.

Users can import multiple JSON files through the app. Existing filename or quiz-ID
conflicts require confirmation before replacement.
