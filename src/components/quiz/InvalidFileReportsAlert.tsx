import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type InvalidFileReport = {
  fileName: string;
  issues: string[];
};

export function InvalidFileReportsAlert({
  reports,
  entityLabel,
  className,
}: {
  reports: InvalidFileReport[];
  entityLabel: string;
  className?: string;
}) {
  if (reports.length === 0) return null;

  return (
    <Alert variant="destructive" className={cn(className)}>
      <AlertTitle>
        {reports.length} invalid {entityLabel} file(s) were skipped
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
