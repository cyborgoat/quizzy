import type { LucideIcon } from "lucide-react";
import { useId, type ReactNode } from "react";

export function SettingsSection({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="border-b border-zinc-200/70 pb-6 last:border-b-0 last:pb-0">
      <header className="mb-3 flex items-center gap-2">
        <Icon className="size-4 shrink-0 text-zinc-400" aria-hidden="true" />
        <h2 id={headingId} className="text-sm font-semibold text-zinc-900">{title}</h2>
      </header>
      {children}
    </section>
  );
}
