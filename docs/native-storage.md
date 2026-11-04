# Native Storage and Security

## Storage locations

Quiz content remains in the user-selected working directory.

Quizzy stores application data in the Tauri app-config directory:

```text
<Tauri app config directory>/settings.json
<Tauri app config directory>/mistake-index.json
<Tauri app config directory>/goals/
  <goal-id>/
    goal.json
    attempts/
      index.json
      <attempt-id>.json
```

`settings.json` holds the working-directory path, profile name, quiz preferences
(such as `shuffleQuestions` and `shuffleOptions`), and Mistake Log thresholds (`mistakeLogMinMistakes` and
`mistakeLogMaxCorrectnessPercentage`).

Each quiz can have at most one goal. Each goal is stored in its own directory.
`goal.json` contains its target score and description metadata. Attempt
summaries live in `attempts/index.json`, and each full attempt (including
per-question results) is stored separately as `attempts/<attempt-id>.json`.

`mistake-index.json` is a materialized aggregate of per-question mistake
statistics across all scored attempts. Rust rebuilds entries for a quiz when
attempts are saved or deleted, and rebuilds the full index on first read if the
file is missing or its version is stale.

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
| `read_working_directory` | Read top-level JSON files; accepts known file versions and returns unchanged files without contents |
| `import_quiz_file` | Copy a user-selected `.json` file (checked for valid JSON, never overwriting) into the working directory |
| `add_sample_quizzes` | Write the bundled sample quizzes into the working directory, skipping files that already exist |
| `list_archived_quiz_ids` / `set_quiz_archived` | Read and update the archived-quiz registry |
| `delete_quiz_file` | Permanently delete a quiz file and its goals, mistake-index entries and archive entry |
| `read_knowledge_directory` | Read top-level `.md` files in `knowledge-base/`; same known-version behavior as quizzes |
| `write_knowledge_file` / `delete_knowledge_file` | Create, replace or delete one knowledge note (validated file names) |
| `open_knowledge_folder` | Open the `knowledge-base` folder in the system file manager |
| `open_quiz_folder` | Open the configured quiz directory in the system file manager |
| `list_goals` | Load saved goals with attempt summaries |
| `upsert_goal` | Create or update one goal's metadata; rejects a second goal for the same quiz; refreshes that quiz's mistake-index entries |
| `delete_goal` | Delete a goal and its attempt files; removes that quiz from `mistake-index.json` |
| `save_goal_attempt` | Persist one attempt, update its summary index, and refresh that quiz's mistake-index entries |
| `get_goal_attempt` | Load one full attempt with question results |
| `delete_goal_attempt` | Delete one attempt file, remove it from the summary index, and refresh that quiz's mistake-index entries |
| `get_mistake_index` | Load the materialized mistake index (rebuilds if missing, version-mismatched, or attempt-count stale) |
| `synchronize_app_data` | Rescan quiz/knowledge folders, repair goal attempt indexes, refresh goal titles from quiz files, rebuild the mistake index when changed, and return a structured `SyncReport` |

`synchronize_app_data` only writes app-config files (`goals/...`, `mistake-index.json`). It rebuilds each goal's `attempts/index.json` from on-disk attempt files, removes orphan index entries when attempt files are missing, and records per-file changes in the report. Goals whose quiz files are missing are reported as warnings, not deleted.

## Incremental directory reads

Both directory-read commands attach a `version` (`<mtime-nanos>-<byte-length>`) to
each file. The frontend sends back the versions it already holds
(`knownVersions`), and Rust skips reading any file whose version matches,
returning it with `unchanged: true` and no contents. A per-library cache in the
frontend (`src/lib/fileVersionCache.ts`) restores those contents, so a refresh
only reads and transfers files that changed. The cache is cleared when the
working directory changes.

## Filesystem boundaries

The working-directory scanner reads only regular top-level files whose extension
is `.json` (case-insensitive). It does not recursively scan subdirectories.
Scanned JSON files have a UTF-8 byte-order mark stripped before parsing when
present.

The folder-opening command does not accept a path from the frontend. Rust loads
the saved working directory, verifies that it still exists, and then opens it
with the platform file manager.

Tauri capabilities enable the core APIs and native dialogs. General-purpose
filesystem plugin permissions are not granted to the webview.

## Atomic writes

Quizzy uses temporary files and rename operations when writing its own settings,
goal data, `mistake-index.json`, knowledge notes, imported quiz files, and sample
quizzes. Imports and samples never overwrite an existing file. Other changes to
quiz files are made by the user through the system file manager, and Quizzy only
reads them (apart from permanent deletion of an archived quiz).

## Current security notes

- Quiz JSON is treated as data and rendered as React text, not injected HTML.
- There is no network service or remote content loading.
- The application currently configures `csp` as `null`; a production hardening
  pass should define an explicit Content Security Policy.
- Quiz file size is not currently limited.
- The desktop app does not encrypt quiz files or the saved directory path.
