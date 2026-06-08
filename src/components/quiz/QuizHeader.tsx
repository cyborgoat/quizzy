import { quizChromeHeaderClass } from "@/components/quiz/quiz-chrome";
import { quizChromeInnerClass } from "@/components/layout/pageShellClasses";
import { Progress } from "@/components/ui/progress";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export function QuizHeader({
  title,
  modeLabel,
  current,
  total,
  answered,
}: {
  title: string;
  modeLabel?: string;
  current: number;
  total: number;
  answered: number;
}) {
  const isMobile = useIsMobile();

  return (
    <header className={`${quizChromeHeaderClass} bg-white`}>
      <div className={cn(quizChromeInnerClass, "flex h-full items-center gap-3")}>
        {isMobile && (
          <SidebarTrigger
            className="size-9 shrink-0 border border-zinc-200 bg-white hover:bg-zinc-100"
            aria-label="Open question sidebar"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <div className="min-w-0">
              {modeLabel && (
                <p className="truncate text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                  {modeLabel}
                </p>
              )}
              <p className="truncate text-xs font-medium text-zinc-950">{title}</p>
            </div>
            <p className="shrink-0 text-xs text-zinc-500">{current} / {total}</p>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <Progress value={(answered / total) * 100} />
            <span className="shrink-0 text-xs text-zinc-500">{answered} answered</span>
          </div>
        </div>
      </div>
    </header>
  );
}
