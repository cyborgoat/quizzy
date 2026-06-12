import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  applyDialogResizeDelta,
  clampDialogSize,
  getDefaultDialogSize,
  type DialogSize,
  type DialogSizeConstraints,
} from "@/lib/resizableDialogFrame";

type ResizeInteraction = {
  startPointer: { x: number; y: number };
  startSize: DialogSize;
};

export function useResizableDialogSize({
  enabled,
  constraints,
}: {
  enabled: boolean;
  constraints?: DialogSizeConstraints;
}) {
  const constraintsRef = useRef(constraints);

  useEffect(() => {
    constraintsRef.current = constraints;
  }, [constraints]);

  const [size, setSize] = useState<DialogSize>(() => getDefaultDialogSize(constraints));
  const [prevEnabled, setPrevEnabled] = useState(enabled);
  const interactionRef = useRef<ResizeInteraction | null>(null);

  if (enabled !== prevEnabled) {
    setPrevEnabled(enabled);
    if (enabled) {
      setSize(getDefaultDialogSize(constraints));
    }
  }

  useEffect(() => {
    if (!enabled) return;

    function handleResize() {
      setSize((current) => clampDialogSize(current, constraintsRef.current));
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [enabled]);

  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      const interaction = interactionRef.current;
      if (!interaction) return;

      const deltaX = event.clientX - interaction.startPointer.x;
      const deltaY = interaction.startPointer.y - event.clientY;

      setSize(
        applyDialogResizeDelta(
          interaction.startSize,
          deltaX,
          deltaY,
          constraintsRef.current,
        ),
      );
    }

    function handlePointerUp() {
      interactionRef.current = null;
      document.body.style.removeProperty("user-select");
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      document.body.style.removeProperty("user-select");
    };
  }, []);

  const startResizeDrag = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.button !== 0) return;

      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      document.body.style.userSelect = "none";
      interactionRef.current = {
        startPointer: { x: event.clientX, y: event.clientY },
        startSize: size,
      };
    },
    [size],
  );

  return {
    size,
    startResizeDrag,
  };
}
