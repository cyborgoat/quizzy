import type { ReactNode } from "react";

export function SettingsSettingRow({
  label,
  description,
  error,
  children,
}: {
  label: string;
  description: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-zinc-100 py-3 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-950">{label}</p>
        <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
      <div className="shrink-0 self-start sm:self-center">{children}</div>
    </div>
  );
}
