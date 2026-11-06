<div align="center">

<img src="public/quizzy-logo.svg" alt="Quizzy logo" width="120" height="120" />

# Quizzy

**A local-first desktop app for building quiz libraries, tracking study goals, and learning from your mistakes.**

[![Release](https://img.shields.io/github/v/release/cyborgoat/quizzy?style=flat-square)](https://github.com/cyborgoat/quizzy/releases/latest)
[![Build](https://img.shields.io/github/actions/workflow/status/cyborgoat/quizzy/release.yml?style=flat-square&label=release%20build)](https://github.com/cyborgoat/quizzy/actions/workflows/release.yml)
[![License: MIT](https://img.shields.io/github/license/cyborgoat/quizzy?style=flat-square)](LICENSE)
![Platforms](https://img.shields.io/badge/platforms-macOS%20%7C%20Windows-lightgrey?style=flat-square)
[![Built with Tauri](https://img.shields.io/badge/built%20with-Tauri%20v2-24C8DB?style=flat-square)](https://tauri.app)

[Download](https://github.com/cyborgoat/quizzy/releases/latest) ·
[Documentation](docs/README.md) ·
[Quiz format](docs/quiz-format.md) ·
[Report a bug](https://github.com/cyborgoat/quizzy/issues)

</div>

---

## What is Quizzy?

Quizzy turns a folder of plain JSON files into a study app. Point it at a
directory, and every valid quiz file becomes a quiz you can take, score, and
review. Quizzy remembers how you did, shows you the questions you keep missing,
and links them to your own markdown notes.

Everything stays on your machine. There is no account, no server, and no
telemetry: your quizzes, attempts, and notes are ordinary files you own.

## Features

- **Quizzes from plain files.** One `.json` file per quiz in a folder you
  choose. Edit them in any editor, keep them in Git, or generate them with an AI
  assistant. Invalid files are skipped with clear diagnostics instead of crashing
  the app.
- **Single choice, multiple choice, and true/false** questions, with optional
  question and option shuffling, flags for questions to revisit, and explanations
  shown at review.
- **Rich content.** Markdown, GitHub-flavored tables, syntax-highlighted code
  blocks, and LaTeX math in prompts, options, and explanations.
- **Goals and attempt history.** Give each quiz a target score, then track every
  scored attempt, compare progress over time, retake, and review any past attempt
  question by question.
- **Mistake Log.** Questions you miss or flag most often, filtered by thresholds
  you control, with inline review.
- **Knowledge Base.** Write markdown notes, link them to specific quiz questions,
  and see them right next to the questions you struggle with.
- **Library tools.** Search, filter, sort, favorite, and archive quizzes. Import
  files from the app, or open the folder and manage them with your file manager.
- **Local and private.** Data lives in your quiz folder and the app's config
  directory. Nothing is uploaded.

## Install

Download the latest installer for your platform from the
[Releases page](https://github.com/cyborgoat/quizzy/releases/latest).

| Platform | Package |
| --- | --- |
| macOS (Apple silicon) | `.dmg` |
| Windows (x64) | `.exe` installer or `.msi` |

> **Note:** release builds are not yet code-signed or notarized. On macOS you may
> need to right-click the app and choose **Open** the first time; on Windows,
> SmartScreen may ask you to confirm with **More info → Run anyway**.

Prefer to build it yourself? See [Build from source](#build-from-source).

## Quick start

1. Launch Quizzy and open **Settings**.
2. Enter your name and choose a **working directory** for your quizzes, then click **Save**.
3. Back on the home page, click **How to import → Add sample quizzes** to try
   the app right away, or **Open quiz folder** to drop in your own JSON files.
4. Click **Start** on a quiz, answer the questions, and submit.
5. Open **History** to review the attempt, and **Mistake Log** to see what to
   study next.

A minimal quiz looks like this:

```json
{
  "id": "css-basics",
  "title": "CSS Basics",
  "description": "Selectors, the box model, and layout.",
  "tags": ["css", "frontend"],
  "questions": [
    {
      "id": "q1",
      "type": "single_choice",
      "prompt": "Which property changes the text color?",
      "options": ["font-color", "color", "text-style", "foreground"],
      "answerIndex": 1,
      "explanation": "`color` sets the foreground color of text."
    }
  ]
}
```

The full schema, with every question type, is in
[docs/quiz-format.md](docs/quiz-format.md). Ready-made examples live in
[`sample-quizzes/`](sample-quizzes), and the app can generate an AI prompt for
creating quizzes from your own material.

## Documentation

| Guide | What it covers |
| --- | --- |
| [Quick start](docs/quick-start.md) | Setup, first launch, and your first quiz |
| [Features and workflows](docs/features.md) | Every screen and how it behaves |
| [Quiz format](docs/quiz-format.md) | The quiz JSON schema |
| [Knowledge format](docs/knowledge-format.md) | Markdown notes and linking them to questions |
| [Native storage](docs/native-storage.md) | What is stored where on disk |
| [Architecture](docs/architecture.md) | How the app is put together |
| [Development](docs/development.md) | Testing, conventions, and contributing code |

## Build from source

Requirements:

- [Node.js](https://nodejs.org) and npm
- A stable [Rust](https://www.rust-lang.org/tools/install) toolchain
- The [Tauri v2 prerequisites](https://tauri.app/start/prerequisites/) for your operating system

```bash
git clone https://github.com/cyborgoat/quizzy.git
cd quizzy
npm install
npm run tauri dev      # run the desktop app with hot reload
npm run tauri build    # create installers for your platform
```

Checks to run before opening a pull request:

```bash
npm test
npm run lint
npm run build
cargo test --manifest-path src-tauri/Cargo.toml
```

The logo source is `public/quizzy-logo.svg`. After editing it, run
`npm run icons` to regenerate the favicon, PNG logo, and platform icons.

## Tech stack

[Tauri v2](https://tauri.app) and Rust for the native shell and file storage,
[React](https://react.dev) and TypeScript for the interface,
[Vite](https://vite.dev) for the build,
[Tailwind CSS](https://tailwindcss.com) for styling, and
[TanStack Router and Table](https://tanstack.com) for navigation and data tables.

## Contributing

Bug reports, feature ideas, and pull requests are welcome. Please
[open an issue](https://github.com/cyborgoat/quizzy/issues) to discuss larger
changes first, and read [docs/development.md](docs/development.md) for the
project layout and testing conventions.

## License

Quizzy is released under the [MIT License](LICENSE).
