# Native Storage and Security

## Storage locations

Quiz content remains in the user-selected working directory.

Quizzy stores application data in the Tauri app-config directory:

```text
<Tauri app config directory>/settings.json
<Tauri app config directory>/goals/
  <goal-id>/
    goal.json
    attempts/
      index.json
      <attempt-id>.json
```

`settings.json` holds the working-directory path, profile name, and quiz
preferences (such as shuffle mode).

Each goal is stored in its own directory. `goal.json` contains goal
metadata. Attempt summaries live in `attempts/index.json`, and each full
attempt (including per-question results) is stored separately as
`attempts/<attempt-id>.json`.

Legacy single-file `goals.json` data is migrated into this layout on first
load and archived as `goals.json.bak`.

The exact app-config location is platform-dependent and is resolved through
Tauri's path API.

## Native commands

The frontend exposes these operations through `src/lib/native.ts`:

| Command | Purpose |
| --- | --- |
| `get_settings` | Load app settings (directory, profile, preferences) |
| `save_settings` | Persist profile, preferences, and/or working directory |
| `read_working_directory` | Read top-level JSON files |
| `read_import_files` | Read files selected by the native dialog |
| `write_imported_quiz` | Write or replace a validated quiz file |
| `delete_quiz_file` | Delete one named quiz file |
| `list_goals` | Load saved goals with attempt summaries |
| `upsert_goal` | Create or update one goal's metadata |
| `delete_goal` | Delete a goal and its attempt files |
| `save_goal_attempt` | Persist one attempt and update its summary index |
| `get_goal_attempt` | Load one full attempt with question results |
| `delete_goal_attempt` | Delete one attempt file and remove it from the summary index |

## Filesystem boundaries

Destination filenames are accepted only when:

- They contain exactly one path component
- They end with `.json` (case-insensitive)
- They do not contain parent-directory traversal
- They do not contain characters invalid on Windows (`<>:"/\|?*`) or reserved
  Windows device names

The working-directory scanner reads only regular top-level files whose extension
is `.json` (case-insensitive). It does not recursively scan subdirectories.

Imported and scanned JSON files have a UTF-8 byte-order mark stripped before
parsing when present.

Tauri capabilities enable the core APIs and native dialogs. General-purpose
filesystem plugin permissions are not granted to the webview.

## Atomic writes

New files are first written to a temporary file in the destination directory and
then renamed into place.

For replacement:

1. The existing file is renamed to a temporary backup.
2. The new temporary file is renamed to the destination.
3. If that rename fails, Quizzy attempts to restore the backup.
4. After success, the backup is removed.

This reduces the chance of leaving a partially written JSON file after an
interrupted import.

## Conflict handling

The frontend detects:

- Existing destination filenames
- Existing quiz IDs under the same or different filename
- Invalid existing files using the imported filename

The user must confirm before replacement. Rust independently enforces the
`overwrite` flag, so an unconfirmed write cannot silently replace a file.

## Current security notes

- Quiz JSON is treated as data and rendered as React text, not injected HTML.
- There is no network service or remote content loading.
- The application currently configures `csp` as `null`; a production hardening
  pass should define an explicit Content Security Policy.
- Imported file size is not currently limited.
- The desktop app does not encrypt quiz files or the saved directory path.
