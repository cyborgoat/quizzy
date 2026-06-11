import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function SettingsSection({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <header className="flex items-center gap-2 border-b border-zinc-200/55 px-3 py-2">
        <Icon className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-zinc-950">{title}</h2>
      </header>
      <div className="p-3">{children}</div>
    </section>
  );
}
