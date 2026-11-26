import { panelHeadingClassName } from "@/components/ui/typography";
import type { SyncReport } from "@/lib/native";
import type { SyncReportSections } from "@/lib/syncReport";
import { useI18n } from "@/lib/i18n";

export function SyncReportCard({
  sections,
  report,
}: {
  sections: SyncReportSections;
  report: SyncReport;
}) {
  const { t } = useI18n();

  return (
    <div className="pt-1">
      <h3 className={panelHeadingClassName}>{t("sync.report.title")}</h3>

      <div className="mt-2 space-y-2 text-sm text-zinc-700">
        <div>
          <p className="text-xs font-medium text-zinc-800">{t("sync.report.rescanned")}</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-zinc-600">
            {sections.rescanned.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>

        {sections.alreadyInSync ? (
          <p className="text-xs text-zinc-600">
            {t("sync.report.alreadyInSync")}
          </p>
        ) : sections.repaired.length > 0 ? (
          <div>
            <p className="text-xs font-medium text-zinc-800">{t("sync.report.repaired")}</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-zinc-600">
              {sections.repaired.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {sections.warnings.length > 0 && (
          <div>
            <p className="text-xs font-medium text-amber-800">{t("sync.report.warnings")}</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-amber-700">
              {sections.warnings.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        )}

        {report.changes.length > 0 && (
          <div>
            <p className="text-xs font-medium text-zinc-800">{t("sync.report.filesChanged")}</p>
            <ul className="mt-1 divide-y divide-zinc-100">
              {report.changes.map((change, index) => (
                <li
                  key={`${change.kind}-${change.path ?? "none"}-${index}`}
                  className="py-2 first:pt-0 last:pb-0"
                >
                  {change.path && (
                    <code className="block break-all text-xs text-zinc-700">{change.path}</code>
                  )}
                  <span className="mt-0.5 block text-xs text-zinc-600">{change.detail}</span>
                </li>
              ))}
            </ul>
            {report.changesTruncated && (
              <p className="mt-1.5 text-xs text-zinc-500">
                {t("sync.report.changesTruncated")}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
