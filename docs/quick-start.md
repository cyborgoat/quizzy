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

1. On the home page, choose **Choose working directory** and pick a folder for
   your quizzes and notes. Quizzy writes a **Welcome to Quizzy** quiz and linked
   knowledge note into that folder when they are missing.
2. Optionally open **Settings** to enter your name and adjust preferences.
3. Open the welcome quiz (or import your own `.json` files), then choose
   **Start quiz**.
4. Answer in any order, use flags for questions to revisit, and submit when ready.
5. Review the final score, correct answers, and explanations.
6. Optionally create a **Goal** from a quiz’s actions. Each quiz can have one goal.
7. Open **Mistake Log** to review questions missed in scored attempts.
8. Open **Knowledge** to browse notes linked to quiz questions.

The selected working directory and your name are remembered between launches. If
the directory becomes unavailable, Quizzy keeps the configured path and prompts
you to update it in Settings.

Reference files for developers live in `sample-quizzes/`. **How to import** on
the home page explains the quiz format and can re-add the welcome sample.

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
