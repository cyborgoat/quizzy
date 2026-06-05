import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";

export function QuizHeader({
  title,
  current,
  total,
}: {
  title: string;
  current: number;
  total: number;
}) {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-md text-sm font-medium text-zinc-600 outline-none hover:text-zinc-950 focus-visible:ring-2 focus-visible:ring-zinc-500"
          >
            <ArrowLeft className="size-4" /> Back
          </Link>
          <p className="min-w-0 truncate text-sm font-semibold text-zinc-950">{title}</p>
          <p className="shrink-0 text-sm text-zinc-500">
            {current} / {total}
          </p>
        </div>
        <Progress className="mt-4" value={(current / total) * 100} />
      </div>
    </header>
  );
}
