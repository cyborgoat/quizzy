import { cn } from "@/lib/utils";

export function toggleOutlineButtonClass(active: boolean) {
  return cn(
    active &&
      "border-zinc-700 bg-zinc-700 text-white hover:bg-zinc-800 hover:text-white",
  );
}
