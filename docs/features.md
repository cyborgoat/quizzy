# Features and Workflows

## Navigation sidebar

A persistent collapsible sidebar runs along the left edge of every non-quiz
screen. It contains:

- **Home** — the quiz library
- **Goals** — study goals and attempt history
- **Mistake Log** — threshold-filtered mistakes from scored attempts
- **Settings** — profile, appearance, quiz preferences, Mistake Log thresholds, and working directory (pinned to the bottom)

The sidebar shows a badge with the count of active (incomplete) goals. It
collapses to icon-only mode. On desktop the trigger button sits in the sidebar
header; on mobile it moves to the quiz-page header.

## Home page

The home page opens with a personalised greeting — "Hello, {name}" — drawn from
the name set in Settings. Below the greeting, the page lists every valid quiz in
the configured working directory.

Available actions on the home page:

- **Refresh** rescans the working directory. The button spins during the
  operation and a toast confirms completion.
- **Open quiz folder** opens the configured working directory in the system file
  manager.

When the user has active goals, a summary card lists up to three of them with a
link to the full Goals page.

## Goals

The Goals page lets users track progress against specific quizzes. Each goal
includes:

- Linked quiz
- Description
- Optional target score percentage
- Attempt history with scores

Goals are shown in accordion rows. Each row displays target, latest, and highest
scores as pills (green when at or above target, red when below). **Start** on a
row opens the linked quiz; expanding the accordion shows past attempts with
**Review** links.

Available actions:

- **Add goal** creates a goal for any quiz in the library that does not already
  have one. Each quiz can have at most one goal.
- **Edit goal** uses the same target-score and description dialog from either
  the Goals page or a quiz card's goal menu.
- **Complete** / **Reopen** toggles goal completion. Completing without reaching
  the target score requires confirmation.
- **Delete** removes the goal and all saved attempts after confirmation.
- **Delete attempt** removes one saved attempt from a goal's history after
  confirmation.

Completing a **scored attempt** for a quiz with a goal automatically records an
attempt for that goal. **Practice** runs never create goal attempts.

## Attempt review

Each saved attempt opens on a dedicated page at
`/goals/:goalId/attempts/:attemptId`. The page shows:

- Score summary with target, latest, and highest metrics
- Question index grid for quick navigation
- Attempt history panel for switching between attempts
- Inline per-question answer review (correct answer, explanation, flagged state)

**Back to goals** returns to the Goals page and expands the relevant goal row.
**Retake quiz** opens the quiz start screen with **Scored attempt** pre-selected.

### Quiz card goal actions

- A light **goal target icon** in a quiz card header opens an in-page add-goal
  dialog without navigating away from the home page.
- The icon is brown while an active goal remains below its target, including
  before the first attempt, and green once its highest score meets the target.
  Clicking an existing goal icon opens actions to edit the goal in place, view
  attempts, open the quiz-scoped Mistake Log, or delete the goal after
  confirmation.

## Mistake Log

The Mistake Log aggregates incorrect answers from **scored attempts only**.
Practice runs are not included. **Mistake Log** in the sidebar opens the global
view at `/mistakes`; an existing quiz goal's menu can open the same view scoped
to that quiz.

The list shows only questions that meet both configured thresholds:

- Minimum mistakes per question
- Maximum correctness percentage per question (calculated across all scored attempts
  for that quiz)

Mistakes are sorted from most frequent to least frequent. Summary statistics
show qualifying mistake count, total mistake events, and quizzes represented.
The global view includes a quiz filter.

Click a mistake to open a right-side drawer with the full question, your most
recent incorrect answer, the correct answer, and the explanation when available.
The Mistake Log refreshes automatically when goals change (for example after a
scored quiz), when attempts are deleted, and when the app window regains focus.

Configure thresholds under **Settings → Mistake Log**.

## Settings

The Settings page lets users configure their profile and quiz directory. Changes
are staged locally and only committed when **Save** is clicked. Navigating away
with unsaved changes opens a confirmation dialog.

### Profile

The **Full name** field sets the name displayed in the home page greeting.

### Appearance

Customize readability and layout:

- **Font size** — Percentage from 75 to 150 (default 100). Use **Ctrl/Cmd +** or **Ctrl/Cmd −** to step by 5; changes save immediately and sync with this field.
- **Layout density** — Default, Comfortable, or Spacious (widens content areas and increases page padding on larger displays)

Preferences are saved to `settings.json` and applied immediately after Save.

### Quiz preferences

**Shuffle mode** randomizes question order within each question type group during
quiz sessions.

### Mistake Log

Configure when a question appears in the Mistake Log:

- **Minimum mistakes per question** — integer of at least 1
- **Maximum correctness percentage per question** — 0 through 100

A question must satisfy both thresholds to appear in the log.

### Quiz directory

The **Working directory** section shows the currently configured path. Clicking
**Select folder** (or **Change**) opens a native directory picker and stages the
selection. The path is written to disk only when Save is confirmed.

## Quiz library

The home page displays every valid top-level `.json` file in the configured
working directory. Each quiz entry includes:

- Title and optional description
- Tags
- Question count
- Source filename
- Goal target icon and **Start quiz** action

Nested directories and non-JSON files are ignored.

## Working directory

Users choose any existing local directory. Quizzy stores its canonical path in
the application configuration directory and reopens it on future launches.

The working directory is configured exclusively in **Settings**. The home page
provides **Open quiz folder** for direct file management and **Refresh** to
rescan the current directory. The application also rescans automatically when
the window regains focus.

## Managing quiz files

Use **Open quiz folder** to add, replace, rename, or remove top-level `.json`
files with the system file manager. Quizzy validates the directory contents
whenever it refreshes, skips malformed or invalid quiz files, and reports
diagnostics on the home page. Duplicate quiz IDs are also rejected.

## Notifications

Operations that complete asynchronously surface as toast notifications in the
bottom-right corner of the screen:

- Successful refresh, directory change, settings save, and goal or attempt
  changes
- Error conditions from any of the above

## Quiz sessions

Starting a quiz opens a mode picker:

- **Practice** — choose how many questions to take (1 through the full quiz count)
  using a slider. Picks a balanced mix of question types when possible, then
  applies your order/shuffle settings.
  Practice runs do not count toward goals. Pre-selected when starting from the
  home page.
- **Scored attempt** — answer every question in the quiz. Results are saved to
  the matching goal when you submit. Pre-selected when starting from a goal or
  retaking from attempt review.

Quizzy presents one question at a time and supports:

- Single choice
- Multiple choice
- True or false

Question text, options, and explanations support Markdown formatting. This
includes **bold**, *italic*, `inline code`, fenced code blocks, and math
formulas rendered with KaTeX using `$…$` for inline math and `$$…$$` for
display math. See [Quiz JSON format](quiz-format.md#markdown-in-question-content)
for syntax reference and examples.

Behavior:

- Answers are saved as editable drafts as soon as they are selected.
- Answer options do not show a "Selected" label; the checkbox or radio control
  already indicates selection state.
- Users can jump directly to any question from the question navigator.
- **Previous** and **Next** buttons appear inline below each question for
  sequential navigation.
- Questions can be flagged for review whether or not they have an answer.
- The navigator identifies current, answered, unanswered, and flagged questions.
- Each question is worth one point.
- Multiple-choice answers require an exact set match; there is no partial credit.
- Correctness and explanations remain hidden during the attempt.
- The quiz can be submitted at any time from the sticky footer, after confirming
  answered, unanswered, and flagged counts.
- Unanswered questions are scored as incorrect.

The sticky footer contains **Home** (exit with confirmation) on the left and
**Submit quiz** on the right, both always reachable regardless of scroll position.

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

Quiz files, the configured directory, the user's name, and goal attempt history
survive application restarts. In-progress quiz session state does not:

- No answer progress is stored while a quiz is in progress.
- Restarting or leaving a quiz clears the current session.
- No backend, accounts, database, or cloud synchronization is used.

Goal metadata and completed attempt records are persisted under the Tauri app
config directory. See [Native storage and security](native-storage.md).

## Example data

The repository contains example JSON files under `sample-quizzes/`:

| File | Contents |
| --- | --- |
| `react-basics.json` | React fundamentals |
| `javascript-basics.json` | Core JavaScript behavior |
| `css-basics.json` | CSS fundamentals |
| `comprehensive-stress-test.json` | Large mixed-format quiz for edge-case testing |
| `markdown-showcase.json` | Demonstrates bold, italic, code, and KaTeX math rendering |

These files are for development and manual quiz-folder testing. They are not
embedded in production builds and the app has no special sample loading action.
