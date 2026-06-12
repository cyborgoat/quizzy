import { Label } from "@/components/ui/label";
import type { ReactNode } from "react";

export function SettingsField({
  id,
  label,
  hint,
  error,
  children,
  alignInGrid = false,
}: {
  id?: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  alignInGrid?: boolean;
}) {
  if (alignInGrid) {
    return (
      <div className="row-span-3 grid grid-rows-subgrid">
        <Label htmlFor={id}>{label}</Label>
        {hint ? (
          <p className="mt-0.5 text-xs text-zinc-500">{hint}</p>
        ) : (
          <span aria-hidden="true" className="block" />
        )}
        <div>
          <div className="mt-1.5">{children}</div>
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      {hint && <p className="mt-0.5 text-xs text-zinc-500">{hint}</p>}
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export const settingsAlignedFieldGridClassName =
  "grid gap-3 md:grid-cols-3 md:grid-rows-[auto_auto_auto]";
