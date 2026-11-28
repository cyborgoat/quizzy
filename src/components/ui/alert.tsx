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
        "rounded-xl p-4",
        variant === "default" && "border border-zinc-200 bg-white text-zinc-900",
        variant === "destructive" && "text-zinc-900",
        variant === "success" && "border border-emerald-200 bg-emerald-50 text-emerald-950",
        className,
      )}
      {...props}
    />
  );
}

export function AlertTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <h3 className={cn("mb-1 font-semibold", className)}>{children}</h3>;
}

export function AlertDescription({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("text-sm leading-6 opacity-90", className)}>{children}</div>;
}
