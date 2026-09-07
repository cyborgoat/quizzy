import { confirm } from "@tauri-apps/plugin-dialog";
import { History } from "lucide-react";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { GoalsPanelSection } from "@/components/goals/GoalsPanelSection";
import { goalsSectionScrollClass } from "@/components/goals/goalListStyles";
import { RecentAttemptRow } from "@/components/goals/RecentAttemptRow";
import { useGoals } from "@/hooks/useGoals";
import {
  RECENT_ATTEMPTS_INITIAL_COUNT,
  RECENT_ATTEMPTS_LOAD_MORE_COUNT,
  type RecentAttemptEntry,
} from "@/lib/recentAttempts";

export function GoalsRecentAttemptsSection({
  attempts,
}: {
  attempts: RecentAttemptEntry[];
}) {
  const { deleteAttempt } = useGoals();
  const [expanded, setExpanded] = useState(true);
  const [visibleCount, setVisibleCount] = useState(RECENT_ATTEMPTS_INITIAL_COUNT);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const visibleAttempts = attempts.slice(0, visibleCount);
  const hasMore = visibleCount < attempts.length;

  useEffect(() => {
    if (!expanded || !hasMore) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        setVisibleCount((count) =>
          Math.min(count + RECENT_ATTEMPTS_LOAD_MORE_COUNT, attempts.length),
        );
      },
      { root: scrollRef.current, rootMargin: "120px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [attempts.length, expanded, hasMore]);

  async function handleDeleteAttempt(
    goalId: string,
    attemptId: string,
    event: MouseEvent,
  ) {
    event.preventDefault();
    event.stopPropagation();
    const ok = await confirm("Delete this attempt? This cannot be undone.", {
      title: "Delete attempt?",
      kind: "warning",
    });
    if (ok) await deleteAttempt(goalId, attemptId);
  }

  return (
    <GoalsPanelSection
      icon={History}
      title="Recent attempts"
      count={attempts.length}
      collapsible
      expanded={expanded}
      onExpandedChange={setExpanded}
    >
      <div ref={scrollRef} className={goalsSectionScrollClass}>
        <ul className="divide-y divide-zinc-100">
          {visibleAttempts.map((entry) => (
            <RecentAttemptRow
              key={entry.attempt.id}
              {...entry}
              onDelete={(event) =>
                void handleDeleteAttempt(entry.goalId, entry.attempt.id, event)
              }
            />
          ))}
        </ul>
        {hasMore && <div ref={sentinelRef} className="h-px" aria-hidden="true" />}
      </div>
    </GoalsPanelSection>
  );
}
