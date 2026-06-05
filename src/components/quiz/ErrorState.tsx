import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <section className="rounded-2xl border border-red-200 bg-red-50 px-6 py-14 text-center">
      <AlertTriangle className="mx-auto mb-4 size-9 text-red-600" aria-hidden="true" />
      <h1 className="text-xl font-semibold text-red-950">{title}</h1>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-red-800">{description}</p>
      <Button className="mt-6" variant="outline" onClick={onAction}>
        {actionLabel}
      </Button>
    </section>
  );
}
