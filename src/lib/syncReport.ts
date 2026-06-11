import type { SyncReport } from "@/lib/native";

export type SyncReportSections = {
  title: string;
  rescanned: string[];
  repaired: string[];
  warnings: string[];
  alreadyInSync: boolean;
};

function hasRepairs(report: SyncReport) {
  return (
    report.legacyGoalsMigrated ||
    report.attemptIndexesRebuilt > 0 ||
    report.attemptIndexEntriesAdded > 0 ||
    report.attemptIndexEntriesRemoved > 0 ||
    report.goalTitlesUpdated > 0 ||
    report.mistakeIndexRebuilt
  );
}

export function formatSyncSections(report: SyncReport): SyncReportSections {
  const rescanned: string[] = [];
  const repaired: string[] = [];
  const warnings = report.warnings.map((warning) => warning.detail);
  const workingDirectoryUnavailable = report.warnings.some(
    (warning) => warning.kind === "working_directory_unavailable",
  );

  if (workingDirectoryUnavailable) {
    rescanned.push(
      "Working directory unavailable — quiz and knowledge folders were not rescanned.",
    );
  } else {
    rescanned.push(
      `Scanned ${report.quizzesScanned} quiz file${report.quizzesScanned === 1 ? "" : "s"} and ${report.knowledgeNotesScanned} knowledge note${report.knowledgeNotesScanned === 1 ? "" : "s"} from your working directory.`,
    );
  }

  if (report.legacyGoalsMigrated) {
    repaired.push("Migrated legacy goals file to per-goal storage.");
  }
  if (report.attemptIndexesRebuilt > 0) {
    repaired.push(
      `Rebuilt ${report.attemptIndexesRebuilt} attempt index file${report.attemptIndexesRebuilt === 1 ? "" : "s"} (attempts/index.json).`,
    );
  }
  if (report.attemptIndexEntriesAdded > 0 || report.attemptIndexEntriesRemoved > 0) {
    repaired.push(
      `Aligned attempt summaries: ${report.attemptIndexEntriesAdded} added, ${report.attemptIndexEntriesRemoved} orphan ${report.attemptIndexEntriesRemoved === 1 ? "entry" : "entries"} removed.`,
    );
  }
  if (report.goalTitlesUpdated > 0) {
    repaired.push(
      `Updated ${report.goalTitlesUpdated} goal title${report.goalTitlesUpdated === 1 ? "" : "s"} to match current quiz files.`,
    );
  }
  if (report.mistakeIndexRebuilt) {
    repaired.push(
      `Rebuilt Mistake Log index (${report.mistakeIndexEntries} question${report.mistakeIndexEntries === 1 ? "" : "s"} tracked).`,
    );
  }

  const alreadyInSync = !hasRepairs(report) && warnings.length === 0;

  return {
    title: "Synchronization complete",
    rescanned,
    repaired,
    warnings,
    alreadyInSync,
  };
}

export function formatSyncSummary(report: SyncReport): string {
  const sections = formatSyncSections(report);
  const parts: string[] = [];

  if (sections.alreadyInSync) {
    return "Synchronized: libraries refreshed; no app data files needed changes.";
  }

  if (report.attemptIndexesRebuilt > 0) {
    parts.push(
      `${report.attemptIndexesRebuilt} attempt index${report.attemptIndexesRebuilt === 1 ? "" : "es"} rebuilt`,
    );
  }
  if (report.goalTitlesUpdated > 0) {
    parts.push(
      `${report.goalTitlesUpdated} goal title${report.goalTitlesUpdated === 1 ? "" : "s"} updated`,
    );
  }
  if (report.mistakeIndexRebuilt) {
    parts.push(
      `Mistake Log index rebuilt (${report.mistakeIndexEntries} question${report.mistakeIndexEntries === 1 ? "" : "s"})`,
    );
  }
  if (report.legacyGoalsMigrated) {
    parts.push("legacy goals migrated");
  }

  let message = parts.length > 0 ? `Synchronized: ${parts.join(", ")}.` : "Synchronized.";
  const missingQuizWarnings = report.warnings.filter(
    (warning) => warning.kind === "goal_quiz_missing",
  ).length;
  if (missingQuizWarnings > 0) {
    message += ` ${missingQuizWarnings} goal${missingQuizWarnings === 1 ? " has" : "s have"} a missing quiz file — see details below.`;
  }

  return message;
}
