import { GoalAttemptRow } from "@/components/goals/GoalAttemptRow";
import type { RecentAttemptEntry } from "@/lib/recentAttempts";

export function RecentAttemptRow(props: RecentAttemptEntry) {
  return (
    <li>
      <GoalAttemptRow {...props} />
    </li>
  );
}
