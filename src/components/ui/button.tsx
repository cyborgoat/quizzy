import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "outline" | "ghost" | "destructive";
type ButtonSize = "default" | "sm" | "icon";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variants: Record<ButtonVariant, string> = {
  default: "border border-transparent bg-zinc-900 text-white hover:bg-zinc-800",
  outline: "border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100",
  ghost: "border border-transparent text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950",
  destructive: "border border-transparent bg-red-600 text-white hover:bg-red-700",
};

const sizes: Record<ButtonSize, string> = {
  default: "h-8 px-3 py-1.5",
  sm: "h-7 rounded-md px-2.5 text-xs",
  icon: "size-8",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      type = "button",
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);

Button.displayName = "Button";

export function toggleOutlineButtonClass(active: boolean) {
  return cn(
    active &&
      "border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800 hover:text-white",
  );
}
