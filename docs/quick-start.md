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

1. Select an existing directory as the Quizzy working directory.
2. Import one or more quiz JSON files.
3. Select a quiz from the home screen.
4. Answer in any order, use flags for questions to revisit, and submit the quiz
   when ready.
5. Review the final score, correct answers, and explanations.

The selected working directory is remembered between launches. If it becomes
unavailable, Quizzy keeps the configured path and asks the user to reconnect it
or choose another directory.

Example quiz files are available in the repository's `sample-quizzes/`
directory. They are reference data and are not bundled into the production app.

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
