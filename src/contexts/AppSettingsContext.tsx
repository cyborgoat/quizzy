import { ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { MistakeLogSettingsContext } from "@/contexts/mistake-log-settings-context";
import { QuizPreferencesContext } from "@/contexts/quiz-preferences-context";
import { UiPreferencesContext } from "@/contexts/ui-preferences-context";
import { UserProfileContext } from "@/contexts/user-profile-context";
import { loadAppSettings } from "@/lib/appSettings";
import { isEditableKeyboardTarget } from "@/lib/keyboard";
import { errorMessage, nativeApi } from "@/lib/native";
import {
  applyUiPreferences,
  clampFontSize,
  formatZoomLimitMessage,
  formatZoomSizeMessage,
  parseUiDensity,
  parseUiFontSize,
  stepFontSize,
  UI_FONT_SIZE_DEFAULT,
  type UiDensity,
} from "@/lib/uiPreferences";

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [userName, setUserNameState] = useState("");
  const [shuffleQuestions, setShuffleQuestionsState] = useState(false);
  const [shuffleOptions, setShuffleOptionsState] = useState(false);
  const [fontSize, setFontSizeState] = useState(UI_FONT_SIZE_DEFAULT);
  const [density, setDensityState] = useState<UiDensity>("default");
  const [minMistakes, setMinMistakesState] = useState(1);
  const [minFlags, setMinFlagsState] = useState(1);
  const [maxCorrectnessPercentage, setMaxCorrectnessPercentageState] = useState(100);
  const fontSizeRef = useRef(fontSize);

  useEffect(() => {
    fontSizeRef.current = fontSize;
  }, [fontSize]);

  useEffect(() => {
    void loadAppSettings().then((settings) => {
      const nextFontSize = parseUiFontSize(settings.uiFontSize);
      const nextDensity = parseUiDensity(settings.uiDensity);
      setUserNameState(settings.profileName);
      setShuffleQuestionsState(settings.shuffleQuestions);
      setShuffleOptionsState(settings.shuffleOptions);
      setFontSizeState(nextFontSize);
      setDensityState(nextDensity);
      setMinMistakesState(settings.mistakeLogMinMistakes);
      setMinFlagsState(settings.mistakeLogMinFlags);
      setMaxCorrectnessPercentageState(settings.mistakeLogMaxCorrectnessPercentage);
      applyUiPreferences(nextFontSize, nextDensity);
    });
  }, []);

  useEffect(() => {
    applyUiPreferences(fontSize, density);
  }, [fontSize, density]);

  const persistFontSize = useCallback(async (value: number) => {
    try {
      await nativeApi.saveSettings({ uiFontSize: clampFontSize(value) });
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }, []);

  const adjustFontSize = useCallback(
    (direction: "up" | "down"): number | null => {
      const next = stepFontSize(fontSizeRef.current, direction);
      if (next === null) return null;
      setFontSizeState(next);
      void persistFontSize(next);
      return next;
    },
    [persistFontSize],
  );

  const notifyZoomAdjust = useCallback(
    (direction: "up" | "down") => {
      const next = adjustFontSize(direction);
      if (next !== null) {
        toast.success(formatZoomSizeMessage(next));
        return;
      }

      toast.warning(formatZoomLimitMessage(direction), {
        icon:
          direction === "up" ? (
            <ZoomIn className="size-4 shrink-0 text-amber-600" />
          ) : (
            <ZoomOut className="size-4 shrink-0 text-amber-600" />
          ),
      });
    },
    [adjustFontSize],
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
      if (isEditableKeyboardTarget(event.target)) return;

      if (event.key === "=" || event.key === "+") {
        event.preventDefault();
        notifyZoomAdjust("up");
        return;
      }

      if (event.key === "-") {
        event.preventDefault();
        notifyZoomAdjust("down");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [notifyZoomAdjust]);

  return (
    <UserProfileContext.Provider
      value={{
        userName,
        setUserName: setUserNameState,
      }}
    >
      <UiPreferencesContext.Provider
        value={{
          fontSize,
          density,
          setFontSize: (value: number) => setFontSizeState(clampFontSize(value)),
          setDensity: setDensityState,
        }}
      >
        <QuizPreferencesContext.Provider
          value={{
            shuffleQuestions,
            shuffleOptions,
            setShuffleQuestions: setShuffleQuestionsState,
            setShuffleOptions: setShuffleOptionsState,
          }}
        >
          <MistakeLogSettingsContext.Provider
            value={{
              minMistakes,
              minFlags,
              maxCorrectnessPercentage,
              setMinMistakes: setMinMistakesState,
              setMinFlags: setMinFlagsState,
              setMaxCorrectnessPercentage: setMaxCorrectnessPercentageState,
            }}
          >
            {children}
          </MistakeLogSettingsContext.Provider>
        </QuizPreferencesContext.Provider>
      </UiPreferencesContext.Provider>
    </UserProfileContext.Provider>
  );
}
