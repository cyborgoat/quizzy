import type { SyncReport } from "@/lib/native";
import type { SyncReportSections } from "@/lib/syncReport";

export function SyncReportCard({
  sections,
  report,
}: {
  sections: SyncReportSections;
  report: SyncReport;
}) {
  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
      <h3 className="text-sm font-semibold text-zinc-950">{sections.title}</h3>

      <div className="mt-2 space-y-2 text-sm text-zinc-700">
        <div>
          <p className="text-xs font-medium text-zinc-800">Rescanned</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-zinc-600">
            {sections.rescanned.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>

        {sections.alreadyInSync ? (
          <p className="text-xs text-zinc-600">
            Everything was already in sync. Libraries were refreshed in memory.
          </p>
        ) : sections.repaired.length > 0 ? (
          <div>
            <p className="text-xs font-medium text-zinc-800">Repaired</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-zinc-600">
              {sections.repaired.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {sections.warnings.length > 0 && (
          <div>
            <p className="text-xs font-medium text-amber-800">Warnings</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-amber-700">
              {sections.warnings.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        )}

        {report.changes.length > 0 && (
          <div>
            <p className="text-xs font-medium text-zinc-800">Files changed</p>
            <ul className="mt-1 space-y-1.5">
              {report.changes.map((change, index) => (
                <li
                  key={`${change.kind}-${change.path ?? "none"}-${index}`}
                  className="rounded border border-zinc-200 bg-white px-2.5 py-2"
                >
                  {change.path && (
                    <code className="block text-xs text-zinc-700">{change.path}</code>
                  )}
                  <span className="mt-0.5 block text-xs text-zinc-600">{change.detail}</span>
                </li>
              ))}
            </ul>
            {report.changesTruncated && (
              <p className="mt-1.5 text-xs text-zinc-500">
                Additional changes were applied but omitted from this list.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
