import { cn } from "@/lib/utils";

export function LoadingState({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <p className={cn("py-20 text-center text-sm text-zinc-500", className)}>
      {message}
    </p>
  );
}
