# Quick Start

## Prerequisites

Install:

- Node.js and npm
- A stable Rust toolchain
- The Tauri v2 prerequisites for the target operating system

On macOS, the Xcode Command Line Tools are required. Other platforms require
their corresponding WebView and build dependencies.

## Install dependencies

From the repository root:

```bash
npm install
```

## Run the desktop application

```bash
npm run tauri dev
```

Tauri starts the Vite development server on port `1420`, compiles the Rust
application, and opens the desktop window.

## First launch

1. Complete the first-launch wizard:
   - Choose **language** (English, Spanish, or Chinese). This sets the UI language
     and the Welcome sample language.
   - Choose a **working folder** for quizzes and notes. Quizzy writes a
     **Welcome to Quizzy** quiz and linked knowledge note when they are missing.
   - Optionally enable **QuizHub** and keep the default catalog URL or set your own.
   - Read the short getting-started tips, then continue into the library.
2. Open **Settings** anytime to change language, QuizHub, shortcuts, or other
   preferences. Settings also includes leveled **Reset** actions.
3. Open the welcome quiz (or import your own `.json` files), then choose
   **Start quiz**.
4. Answer in any order, use flags for questions to revisit, and submit when ready.
5. Review the final score, correct answers, and explanations.
6. Optionally create a **Goal** from a quiz’s actions. Each quiz can have one goal.
7. Open **Mistake Log** to review questions missed in scored attempts.
8. Open **Knowledge** to browse notes linked to quiz questions.
9. If QuizHub is enabled, open **QuizHub** in the sidebar to browse and download
   curated quizzes and notes.

Language, working directory, and QuizHub preference are remembered between
launches. If the directory becomes unavailable, Quizzy keeps the configured path
and prompts you to update it in Settings.

Reference files for developers live in `sample-quizzes/`. **How to import** on
the home page is a compact markdown guide with a **Copy prompt** action for
LLM-generated quizzes, plus import and open-folder shortcuts.

## Frontend-only development

```bash
npm run dev
```

This runs the Vite frontend without the Tauri command backend. Features that
invoke native dialogs or filesystem commands require `npm run tauri dev`.

## Build

Build the web assets:

```bash
npm run build
```

Build the desktop application and platform installers:

```bash
npm run tauri build
```

For a faster integration check without packaging installers:

```bash
npm run tauri build -- --debug --no-bundle
```
