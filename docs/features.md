# Features and Workflows

## Quiz library

The home page displays every valid top-level `.json` file in the configured
working directory. Each quiz entry includes:

- Title and optional description
- Tags
- Question count
- Source filename
- Start and delete actions

Nested directories and non-JSON files are ignored.

## Working directory

Users choose any existing local directory. Quizzy stores its canonical path in
the application configuration directory and reopens it on future launches.

Available actions:

- **Change folder** selects a different working directory.
- **Refresh** rescans the current directory.
- Refocusing the application window also triggers a rescan.

## Importing quizzes

The import dialog accepts multiple JSON files.

Before writing anything, Quizzy:

1. Reads the selected files through the native layer.
2. Parses and validates them with Zod.
3. Rejects malformed JSON and invalid quiz structures.
4. Detects duplicate filenames and quiz IDs.
5. Requests confirmation when imported quizzes conflict with existing files.

Imports copy the selected content into the working directory. The original files
are not modified.

When a quiz ID already exists under a different filename, confirming replacement
writes the new file and removes the previous file. Invalid files are skipped and
reported.

## Quiz sessions

Quizzy presents one question at a time and supports:

- Single choice
- Multiple choice
- True or false

Behavior:

- An answer is required before submission.
- Submitted selections are locked.
- Each question is worth one point.
- Multiple-choice answers require an exact set match; there is no partial credit.
- Feedback identifies correct and incorrect results using text and styling.
- Explanations appear after submission when provided by the quiz file.

## Results and review

After the last submitted question, the result screen shows:

- Score and total question count
- Percentage
- Incorrect count
- Restart action
- Return-home action
- Per-question answer review

The review includes the user's answer, the correct answer when necessary, and
the explanation when available.

## Data lifetime

Quiz files and the configured directory survive application restarts. Quiz
session state does not:

- No score history is stored.
- No answer progress is stored.
- Restarting or leaving a quiz clears the current session.
- No backend, accounts, database, or cloud synchronization is used.

## Example data

The repository contains example JSON files under `sample-quizzes/`. They are
ordinary quiz files for development, documentation, and manual import testing.
They are not embedded in production builds and the app has no special sample
loading action.
