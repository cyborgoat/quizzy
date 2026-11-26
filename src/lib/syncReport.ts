import type { TFunction } from "@/lib/i18n-messages";
import type { SyncReport } from "@/lib/native";

export type SyncReportSections = {
  rescanned: string[];
  repaired: string[];
  warnings: string[];
  alreadyInSync: boolean;
};

function hasRepairs(report: SyncReport) {
  return (
    report.attemptIndexesRebuilt > 0 ||
    report.attemptIndexEntriesAdded > 0 ||
    report.attemptIndexEntriesRemoved > 0 ||
    report.goalTitlesUpdated > 0 ||
    report.mistakeIndexRebuilt
  );
}

export function formatSyncSections(report: SyncReport, t: TFunction): SyncReportSections {
  const rescanned: string[] = [];
  const repaired: string[] = [];
  const warnings = report.warnings.map((warning) => warning.detail);
  const workingDirectoryUnavailable = report.warnings.some(
    (warning) => warning.kind === "working_directory_unavailable",
  );

  if (workingDirectoryUnavailable) {
    rescanned.push(t("sync.report.dirUnavailable"));
  } else {
    rescanned.push(
      t("sync.report.scanned", {
        quizzes: t(report.quizzesScanned === 1 ? "sync.quizFilesOne" : "sync.quizFilesMany", {
          count: report.quizzesScanned,
        }),
        notes: t(report.knowledgeNotesScanned === 1 ? "sync.notesOne" : "sync.notesMany", {
          count: report.knowledgeNotesScanned,
        }),
      }),
    );
  }

  if (report.attemptIndexesRebuilt > 0) {
    repaired.push(
      t(
        report.attemptIndexesRebuilt === 1
          ? "sync.report.attemptIndexesOne"
          : "sync.report.attemptIndexesMany",
        { count: report.attemptIndexesRebuilt },
      ),
    );
  }
  if (report.attemptIndexEntriesAdded > 0 || report.attemptIndexEntriesRemoved > 0) {
    repaired.push(
      t(
        report.attemptIndexEntriesRemoved === 1
          ? "sync.report.attemptSummariesOne"
          : "sync.report.attemptSummariesMany",
        { added: report.attemptIndexEntriesAdded, removed: report.attemptIndexEntriesRemoved },
      ),
    );
  }
  if (report.goalTitlesUpdated > 0) {
    repaired.push(
      t(
        report.goalTitlesUpdated === 1 ? "sync.report.goalTitlesOne" : "sync.report.goalTitlesMany",
        { count: report.goalTitlesUpdated },
      ),
    );
  }
  if (report.mistakeIndexRebuilt) {
    repaired.push(
      t(
        report.mistakeIndexEntries === 1
          ? "sync.report.mistakeIndexOne"
          : "sync.report.mistakeIndexMany",
        { count: report.mistakeIndexEntries },
      ),
    );
  }

  const alreadyInSync = !hasRepairs(report) && warnings.length === 0;

  return {
    rescanned,
    repaired,
    warnings,
    alreadyInSync,
  };
}

export function formatSyncSummary(report: SyncReport, t: TFunction): string {
  const sections = formatSyncSections(report, t);
  const parts: string[] = [];

  if (sections.alreadyInSync) {
    return t("sync.summary.inSync");
  }

  if (report.attemptIndexesRebuilt > 0) {
    parts.push(
      t(
        report.attemptIndexesRebuilt === 1
          ? "sync.summary.attemptIndexOne"
          : "sync.summary.attemptIndexMany",
        { count: report.attemptIndexesRebuilt },
      ),
    );
  }
  if (report.goalTitlesUpdated > 0) {
    parts.push(
      t(
        report.goalTitlesUpdated === 1
          ? "sync.summary.goalTitleOne"
          : "sync.summary.goalTitleMany",
        { count: report.goalTitlesUpdated },
      ),
    );
  }
  if (report.mistakeIndexRebuilt) {
    parts.push(
      t(
        report.mistakeIndexEntries === 1
          ? "sync.summary.mistakeIndexOne"
          : "sync.summary.mistakeIndexMany",
        { count: report.mistakeIndexEntries },
      ),
    );
  }

  let message =
    parts.length > 0
      ? t("sync.summary.done", { parts: parts.join(t("sync.summary.separator")) })
      : t("sync.summary.doneNoParts");
  const missingQuizWarnings = report.warnings.filter(
    (warning) => warning.kind === "goal_quiz_missing",
  ).length;
  if (missingQuizWarnings > 0) {
    message += ` ${t(
      missingQuizWarnings === 1 ? "sync.summary.missingQuizOne" : "sync.summary.missingQuizMany",
      { count: missingQuizWarnings },
    )}`;
  }

  return message;
}
