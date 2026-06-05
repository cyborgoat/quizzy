import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function QuizHeader({
  title,
  current,
  total,
  answered,
}: {
  title: string;
  current: number;
  total: number;
  answered: number;
}) {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger
              className="size-9 border border-zinc-200 bg-white hover:bg-zinc-100"
              aria-label="Toggle question sidebar"
            />
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-md text-sm font-medium text-zinc-600 outline-none hover:text-zinc-950 focus-visible:ring-2 focus-visible:ring-zinc-500"
            >
              <ArrowLeft className="size-4" /> Back
            </Link>
          </div>
          <p className="min-w-0 truncate text-sm font-semibold text-zinc-950">{title}</p>
          <p className="shrink-0 text-sm text-zinc-500">
            {current} / {total}
          </p>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Progress value={(answered / total) * 100} />
          <span className="shrink-0 text-xs text-zinc-500">
            {answered} answered
          </span>
        </div>
      </div>
    </header>
  );
}
