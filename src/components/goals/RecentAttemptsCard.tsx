import { formatShortDate } from "@/lib/formatDate";
import type { RecentAttemptEntry } from "@/lib/recentAttempts";

function formatAttemptLine(entry: RecentAttemptEntry) {
  const parts = [
    formatShortDate(entry.takenAt),
    `${entry.score}/${entry.total} · ${entry.percentage}%`,
  ];
  if (entry.goalCompleted) parts.push("Done");
  if (entry.incorrectCount > 0) parts.push(`${entry.incorrectCount} incorrect`);
  return parts.join(" · ");
}

export function RecentAttemptsCard({ attempts }: { attempts: RecentAttemptEntry[] }) {
  if (attempts.length === 0) {
    return null;
  }

  return (
    <ul className="space-y-1">
      {attempts.map((entry) => (
        <li
          key={`${entry.goalId}:${entry.attemptId}`}
          className="truncate text-xs leading-snug text-zinc-500"
        >
          <span className="font-medium text-zinc-950">{entry.quizTitle}</span>
          {` · ${formatAttemptLine(entry)}`}
        </li>
      ))}
    </ul>
  );
}
