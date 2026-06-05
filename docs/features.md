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

- Answers are saved as editable drafts as soon as they are selected.
- Users can jump directly to any question from the question navigator.
- Previous and Next controls remain available for sequential navigation.
- Questions can be flagged for review whether or not they have an answer.
- The navigator identifies current, answered, unanswered, and flagged questions.
- Each question is worth one point.
- Multiple-choice answers require an exact set match; there is no partial credit.
- Correctness and explanations remain hidden during the attempt.
- The quiz can be submitted at any time after confirming answered, unanswered,
  and flagged counts.
- Unanswered questions are scored as incorrect.

On desktop, question navigation is displayed in a collapsible left sidebar. On
narrow screens, the same shadcn sidebar opens as an accessible off-canvas sheet.
The sidebar can also be toggled with `Cmd+B` on macOS or `Ctrl+B` on Windows.

## Results and review

After final quiz submission, the result screen shows:

- Score and total question count
- Percentage
- Incorrect count
- Unanswered count
- Restart action
- Return-home action
- Per-question answer review

The review includes every question, the user's answer or unanswered status, the
correct answer, the explanation when available, and whether it was flagged.

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
