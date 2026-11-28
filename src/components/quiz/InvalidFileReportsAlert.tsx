import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

type InvalidFileReport = {
  fileName: string;
  issues: string[];
};

export function InvalidFileReportsAlert({
  reports,
  kind,
  className,
}: {
  reports: InvalidFileReport[];
  kind: "quiz" | "knowledge";
  className?: string;
}) {
  const { t } = useI18n();
  if (reports.length === 0) return null;

  return (
    <Alert variant="destructive" className={cn("flex gap-3", className)}>
      <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-600" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <AlertTitle>
          {t(kind === "quiz" ? "files.invalidSkippedQuiz" : "files.invalidSkippedKnowledge", {
            count: reports.length,
          })}
        </AlertTitle>
        <AlertDescription>
          <ul className="mt-2 space-y-2 wrap-break-word">
            {reports.map((report) => (
              <li key={report.fileName} className="min-w-0">
                <strong className="font-medium text-zinc-900">{report.fileName}:</strong>{" "}
                {report.issues.join(" ")}
              </li>
            ))}
          </ul>
        </AlertDescription>
      </div>
    </Alert>
  );
}
