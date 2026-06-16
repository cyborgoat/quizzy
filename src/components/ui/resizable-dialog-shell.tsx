import * as Dialog from "@radix-ui/react-dialog";
import { MoveDiagonal } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useResizableDialogSize } from "@/hooks/useResizableDialogSize";
import {
  DEFAULT_RESIZABLE_DIALOG_SIZE_CONSTRAINTS,
  type DialogSizeConstraints,
} from "@/lib/resizableDialogFrame";
import { dialogOverlayClassName } from "@/components/ui/dialog-overlay";
import { cn } from "@/lib/utils";

export type DialogStackLayer = "default" | "stacked" | "elevated";

const layerClassNames: Record<DialogStackLayer, { overlay: string; content: string }> = {
  default: { overlay: "z-60", content: "z-60" },
  stacked: { overlay: "z-70", content: "z-70" },
  elevated: { overlay: "z-80", content: "z-80" },
};

export function ResizableDialogShell({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  layer = "default",
  resizeDisabled = false,
  constraints = DEFAULT_RESIZABLE_DIALOG_SIZE_CONSTRAINTS,
  bodyClassName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer: ReactNode;
  layer?: DialogStackLayer;
  resizeDisabled?: boolean;
  constraints?: DialogSizeConstraints;
  bodyClassName?: string;
}) {
  const { size, startResizeDrag } = useResizableDialogSize({
    enabled: open,
    constraints,
  });
  const layers = layerClassNames[layer];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(dialogOverlayClassName, layers.overlay)}
        />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl focus:outline-none",
            layers.content,
          )}
          style={{
            width: size.width,
            height: size.height,
          }}
        >
          <div className="relative shrink-0 border-b border-zinc-100 px-6 py-3 pr-14">
            <Dialog.Title className="text-base font-semibold text-zinc-950">
              {title}
            </Dialog.Title>
            {description ? (
              <Dialog.Description className="mt-0.5 text-sm text-zinc-500">
                {description}
              </Dialog.Description>
            ) : null}
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Resize dialog"
              className="absolute right-4 top-3 size-8 cursor-nwse-resize text-zinc-900 hover:bg-zinc-100/60 active:cursor-nwse-resize"
              disabled={resizeDisabled}
              onPointerDown={startResizeDrag}
            >
              <MoveDiagonal className="size-4" />
            </Button>
          </div>

          <div
            className={cn(
              "min-h-0 flex-1 overflow-y-auto px-6 py-5",
              bodyClassName,
            )}
          >
            {children}
          </div>

          <div className="flex shrink-0 justify-end gap-1 border-t border-zinc-100 px-6 py-3">
            {footer}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
