import { describe, expect, it } from "vitest";
import { createTranslator } from "@/lib/i18n-messages";
import { formatSyncSections, formatSyncSummary } from "@/lib/syncReport";
import type { SyncReport } from "@/lib/native";

const t = createTranslator("en");

function emptyReport(overrides: Partial<SyncReport> = {}): SyncReport {
  return {
    quizzesScanned: 0,
    knowledgeNotesScanned: 0,
    goalsChecked: 0,
    appConfigFilesWritten: 0,
    attemptIndexesRebuilt: 0,
    attemptIndexEntriesAdded: 0,
    attemptIndexEntriesRemoved: 0,
    goalTitlesUpdated: 0,
    mistakeIndexRebuilt: false,
    mistakeIndexEntries: 0,
    changes: [],
    changesTruncated: false,
    warnings: [],
    ...overrides,
  };
}

describe("syncReport", () => {
  it("reports already in sync when nothing was repaired", () => {
    const sections = formatSyncSections(
      emptyReport({ quizzesScanned: 2, knowledgeNotesScanned: 1 }),
      t,
    );
    expect(sections.alreadyInSync).toBe(true);
    expect(formatSyncSummary(emptyReport({ quizzesScanned: 2 }), t)).toBe(
      "Synchronized: libraries refreshed; no app data files needed changes.",
    );
  });

  it("summarizes repairs and warnings", () => {
    const report = emptyReport({
      attemptIndexesRebuilt: 2,
      goalTitlesUpdated: 1,
      mistakeIndexRebuilt: true,
      mistakeIndexEntries: 14,
      warnings: [
        {
          kind: "goal_quiz_missing",
          detail: 'Goal for "Old Quiz" (quiz old, 3 attempts) — quiz file not found.',
        },
      ],
    });

    expect(formatSyncSummary(report, t)).toContain("2 attempt indexes rebuilt");
    expect(formatSyncSummary(report, t)).toContain("1 goal title updated");
    expect(formatSyncSummary(report, t)).toContain("14 questions");
    expect(formatSyncSummary(report, t)).toContain("missing quiz file");

    const sections = formatSyncSections(report, t);
    expect(sections.repaired.length).toBeGreaterThan(0);
    expect(sections.warnings).toHaveLength(1);
    expect(sections.alreadyInSync).toBe(false);
  });

  it("handles unavailable working directory in rescanned section", () => {
    const sections = formatSyncSections(
      emptyReport({
        warnings: [
          {
            kind: "working_directory_unavailable",
            detail: "Working directory unavailable — quiz and knowledge folders were not rescanned.",
          },
        ],
      }),
      t,
    );

    expect(sections.rescanned[0]).toContain("unavailable");
  });
});
