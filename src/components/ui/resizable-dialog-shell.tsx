import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { useResizableDialogSize } from "@/hooks/useResizableDialogSize";
import {
  DEFAULT_RESIZABLE_DIALOG_SIZE_CONSTRAINTS,
  type DialogResizeEdge,
  type DialogSizeConstraints,
} from "@/lib/resizableDialogFrame";
import { dialogOverlayClassName } from "@/components/ui/dialog-overlay";
import { dialogContentMotionClassName } from "@/components/ui/motion";
import { cn } from "@/lib/utils";

export type DialogStackLayer = "default" | "stacked" | "elevated";

const layerClassNames: Record<DialogStackLayer, { overlay: string; content: string }> = {
  default: { overlay: "z-60", content: "z-60" },
  stacked: { overlay: "z-70", content: "z-70" },
  elevated: { overlay: "z-80", content: "z-80" },
};

const RESIZE_HANDLES: {
  edge: DialogResizeEdge;
  className: string;
  cursor: string;
}[] = [
  { edge: "n", className: "left-3 right-3 top-0 h-1.5", cursor: "cursor-n-resize" },
  { edge: "s", className: "left-3 right-3 bottom-0 h-1.5", cursor: "cursor-s-resize" },
  { edge: "e", className: "top-3 bottom-3 right-0 w-1.5", cursor: "cursor-e-resize" },
  { edge: "w", className: "top-3 bottom-3 left-0 w-1.5", cursor: "cursor-w-resize" },
  { edge: "ne", className: "right-0 top-0 size-3", cursor: "cursor-ne-resize" },
  { edge: "nw", className: "left-0 top-0 size-3", cursor: "cursor-nw-resize" },
  { edge: "se", className: "right-0 bottom-0 size-3", cursor: "cursor-se-resize" },
  { edge: "sw", className: "left-0 bottom-0 size-3", cursor: "cursor-sw-resize" },
];

export function ResizableDialogShell({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  headerActions,
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
  headerActions?: ReactNode;
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
            dialogContentMotionClassName,
            layers.content,
          )}
          style={{
            width: size.width,
            height: size.height,
          }}
        >
          <div
            className={cn(
              "relative shrink-0 border-b border-zinc-100 px-6 py-3",
              headerActions ? "pr-24" : "pr-6",
            )}
          >
            <Dialog.Title className="text-base font-semibold text-zinc-950">
              {title}
            </Dialog.Title>
            {description ? (
              <Dialog.Description className="mt-0.5 text-sm text-zinc-500">
                {description}
              </Dialog.Description>
            ) : null}
            {headerActions ? (
              <div className="absolute right-4 top-3 flex items-center gap-1">
                {headerActions}
              </div>
            ) : null}
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

          {!resizeDisabled
            ? RESIZE_HANDLES.map(({ edge, className, cursor }) => (
                <div
                  key={edge}
                  aria-hidden="true"
                  className={cn(
                    "absolute z-10 touch-none",
                    cursor,
                    className,
                  )}
                  onPointerDown={(event) => startResizeDrag(edge, event)}
                />
              ))
            : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
