import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Alert({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLDivElement> & { variant?: "default" | "destructive" | "success" }) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-xl border p-4",
        variant === "default" && "border-zinc-200 bg-white text-zinc-900",
        variant === "destructive" && "border-red-200 bg-red-50 text-red-950",
        variant === "success" && "border-emerald-200 bg-emerald-50 text-emerald-950",
        className,
      )}
      {...props}
    />
  );
}

export function AlertTitle({ children }: { children: ReactNode }) {
  return <h3 className="mb-1 font-semibold">{children}</h3>;
}

export function AlertDescription({ children }: { children: ReactNode }) {
  return <div className="text-sm leading-6 opacity-90">{children}</div>;
}
