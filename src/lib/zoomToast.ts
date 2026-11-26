import { toast } from "sonner";
import { createTranslator } from "@/lib/i18n-messages";
import type { AppLocale } from "@/lib/locale";
import { clampFontSize } from "@/lib/uiPreferences";

const ZOOM_TOAST_ID = "ui-zoom-level";

export function showZoomLevelToast(fontSize: number, locale: AppLocale = "en") {
  const t = createTranslator(locale);
  toast(t("ui.viewSize", { percent: clampFontSize(fontSize) }), {
    id: ZOOM_TOAST_ID,
    duration: 1500,
  });
}
