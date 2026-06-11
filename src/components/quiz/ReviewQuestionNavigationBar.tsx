import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect } from "react";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { isEditableKeyboardTarget } from "@/lib/keyboard";

export function ReviewQuestionNavigationBar({
  position,
  total,
  onPrevious,
  onNext,
  disablePrevious = false,
  disableNext = false,
}: {
  position: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
  disablePrevious?: boolean;
  disableNext?: boolean;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (isEditableKeyboardTarget(event.target)) return;
      if (total === 0) return;

      event.preventDefault();

      if (event.key === "ArrowLeft" && !disablePrevious) {
        onPrevious();
      }
      if (event.key === "ArrowRight" && !disableNext) {
        onNext();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [total, disablePrevious, disableNext, onPrevious, onNext]);

  return (
    <div className="flex items-center justify-center gap-2">
      <IconActionButton
        icon={ChevronLeft}
        label="Previous question"
        onClick={onPrevious}
        disabled={disablePrevious}
      />
      <p className="min-w-14 text-center text-xs tabular-nums text-zinc-500">
        {position} / {total}
      </p>
      <IconActionButton
        icon={ChevronRight}
        label="Next question"
        onClick={onNext}
        disabled={disableNext}
      />
    </div>
  );
}
