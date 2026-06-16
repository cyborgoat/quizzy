import { cn } from "@/lib/utils";

export function toggleOutlineButtonClass(active: boolean) {
  return cn(
    active &&
      "border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800 hover:text-white",
  );
}
