import { FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <section className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-14 text-center">
      <FolderOpen className="mx-auto mb-4 size-9 text-zinc-400" aria-hidden="true" />
      <h2 className="text-xl font-semibold text-zinc-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-zinc-600">{description}</p>
      {actionLabel && onAction && (
        <Button className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </section>
  );
}
