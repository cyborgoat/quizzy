import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

/** Distinct from surrounding zinc body copy so actions read as links. */
export const errorStateActionClassName =
  "font-medium text-sky-700 underline-offset-2 hover:text-sky-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2";

export function ErrorStateAction({
  children,
  onClick,
  className,
}: {
  children: ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={cn(errorStateActionClassName, "cursor-pointer", className)}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function ErrorState({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  /** Fluent sentence with clickable action phrases. */
  actions: ReactNode;
}) {
  return (
    <section className="px-6 py-14 text-center">
      <AlertTriangle className="mx-auto mb-4 size-9 text-red-600" aria-hidden="true" />
      <h1 className="text-xl font-semibold text-zinc-950">{title}</h1>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-zinc-600">{description}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-zinc-600">{actions}</p>
    </section>
  );
}
