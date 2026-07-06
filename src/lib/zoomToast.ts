import { toast } from "sonner";
import { clampFontSize } from "@/lib/uiPreferences";

const ZOOM_TOAST_ID = "ui-zoom-level";

export function showZoomLevelToast(fontSize: number) {
  toast(`View size ${clampFontSize(fontSize)}%`, {
    id: ZOOM_TOAST_ID,
    duration: 1500,
  });
}
