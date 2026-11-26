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
    <Alert variant="destructive" className={cn(className)}>
      <AlertTitle>
        {t(kind === "quiz" ? "files.invalidSkippedQuiz" : "files.invalidSkippedKnowledge", {
          count: reports.length,
        })}
      </AlertTitle>
      <AlertDescription>
        <ul className="mt-2 space-y-2 wrap-break-word">
          {reports.map((report) => (
            <li key={report.fileName} className="min-w-0">
              <strong>{report.fileName}:</strong> {report.issues.join(" ")}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
