import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { AppShortcutsContext } from "@/contexts/app-shortcuts-context";
import { MistakeLogSettingsContext } from "@/contexts/mistake-log-settings-context";
import { QuizPreferencesContext } from "@/contexts/quiz-preferences-context";
import { UiPreferencesContext } from "@/contexts/ui-preferences-context";
import { UserProfileContext } from "@/contexts/user-profile-context";
import { loadAppSettings } from "@/lib/appSettings";
import { isEditableKeyboardTarget } from "@/lib/keyboard";
import {
  DEFAULT_KEYBINDS,
  matchesKeybind,
  parseKeybind,
  serializeKeybind,
  type Keybind,
} from "@/lib/keybinds";
import { errorMessage, nativeApi } from "@/lib/native";
import { toggleSidebarFromShortcut } from "@/lib/sidebarToggleRegistry";
import {
  applyUiPreferences,
  clampFontSize,
  parseUiFontSize,
  stepFontSize,
  UI_FONT_SIZE_DEFAULT,
} from "@/lib/uiPreferences";

function loadShortcut(raw: string | undefined, fallback: Keybind) {
  return parseKeybind(raw, fallback);
}

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [userName, setUserNameState] = useState("");
  const [shuffleQuestions, setShuffleQuestionsState] = useState(false);
  const [shuffleOptions, setShuffleOptionsState] = useState(false);
  const [fontSize, setFontSizeState] = useState(UI_FONT_SIZE_DEFAULT);
  const [minMistakes, setMinMistakesState] = useState(1);
  const [minFlags, setMinFlagsState] = useState(1);
  const [maxCorrectnessPercentage, setMaxCorrectnessPercentageState] = useState(100);
  const [knowledgeLinkShortcut, setKnowledgeLinkShortcutState] = useState(
    serializeKeybind(DEFAULT_KEYBINDS.knowledgeLink),
  );
  const [knowledgeNewNoteShortcut, setKnowledgeNewNoteShortcutState] = useState(
    serializeKeybind(DEFAULT_KEYBINDS.knowledgeNewNote),
  );
  const [zoomInShortcut, setZoomInShortcutState] = useState(
    serializeKeybind(DEFAULT_KEYBINDS.zoomIn),
  );
  const [zoomOutShortcut, setZoomOutShortcutState] = useState(
    serializeKeybind(DEFAULT_KEYBINDS.zoomOut),
  );
  const [toggleSidebarShortcut, setToggleSidebarShortcutState] = useState(
    serializeKeybind(DEFAULT_KEYBINDS.toggleSidebar),
  );
  const fontSizeRef = useRef(fontSize);
  const shortcutsRef = useRef<{ zoomIn: Keybind; zoomOut: Keybind; toggleSidebar: Keybind }>({
    zoomIn: DEFAULT_KEYBINDS.zoomIn,
    zoomOut: DEFAULT_KEYBINDS.zoomOut,
    toggleSidebar: DEFAULT_KEYBINDS.toggleSidebar,
  });

  const parsedShortcuts = useMemo(
    () => ({
      knowledgeLink: loadShortcut(knowledgeLinkShortcut, DEFAULT_KEYBINDS.knowledgeLink),
      knowledgeNewNote: loadShortcut(knowledgeNewNoteShortcut, DEFAULT_KEYBINDS.knowledgeNewNote),
      zoomIn: loadShortcut(zoomInShortcut, DEFAULT_KEYBINDS.zoomIn),
      zoomOut: loadShortcut(zoomOutShortcut, DEFAULT_KEYBINDS.zoomOut),
      toggleSidebar: loadShortcut(toggleSidebarShortcut, DEFAULT_KEYBINDS.toggleSidebar),
    }),
    [
      knowledgeLinkShortcut,
      knowledgeNewNoteShortcut,
      zoomInShortcut,
      zoomOutShortcut,
      toggleSidebarShortcut,
    ],
  );

  useEffect(() => {
    fontSizeRef.current = fontSize;
  }, [fontSize]);

  useEffect(() => {
    shortcutsRef.current = {
      zoomIn: parsedShortcuts.zoomIn,
      zoomOut: parsedShortcuts.zoomOut,
      toggleSidebar: parsedShortcuts.toggleSidebar,
    };
  }, [parsedShortcuts]);

  useEffect(() => {
    void loadAppSettings().then((settings) => {
      const nextFontSize = parseUiFontSize(settings.uiFontSize);
      setUserNameState(settings.profileName);
      setShuffleQuestionsState(settings.shuffleQuestions);
      setShuffleOptionsState(settings.shuffleOptions);
      setFontSizeState(nextFontSize);
      setMinMistakesState(settings.mistakeLogMinMistakes);
      setMinFlagsState(settings.mistakeLogMinFlags);
      setMaxCorrectnessPercentageState(settings.mistakeLogMaxCorrectnessPercentage);
      setKnowledgeLinkShortcutState(settings.knowledgeLinkShortcutKey);
      setKnowledgeNewNoteShortcutState(settings.knowledgeNewNoteShortcutKey);
      setZoomInShortcutState(settings.zoomInShortcutKey);
      setZoomOutShortcutState(settings.zoomOutShortcutKey);
      setToggleSidebarShortcutState(settings.toggleSidebarShortcutKey);
      applyUiPreferences(nextFontSize);
    });
  }, []);

  useEffect(() => {
    applyUiPreferences(fontSize);
  }, [fontSize]);

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

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableKeyboardTarget(event.target)) return;

      const { zoomIn, zoomOut, toggleSidebar } = shortcutsRef.current;
      if (matchesKeybind(event, zoomIn)) {
        event.preventDefault();
        adjustFontSize("up");
        return;
      }

      if (matchesKeybind(event, zoomOut)) {
        event.preventDefault();
        adjustFontSize("down");
        return;
      }

      if (matchesKeybind(event, toggleSidebar)) {
        event.preventDefault();
        toggleSidebarFromShortcut();
      }
    }

    function handleWheel(event: WheelEvent) {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
      if (isEditableKeyboardTarget(event.target)) return;
      if (event.deltaY === 0) return;

      event.preventDefault();
      adjustFontSize(event.deltaY < 0 ? "up" : "down");
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("wheel", handleWheel);
    };
  }, [adjustFontSize]);

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
          <AppShortcutsContext.Provider
            value={{
              ...parsedShortcuts,
              setKnowledgeLink: setKnowledgeLinkShortcutState,
              setKnowledgeNewNote: setKnowledgeNewNoteShortcutState,
              setZoomIn: setZoomInShortcutState,
              setZoomOut: setZoomOutShortcutState,
              setToggleSidebar: setToggleSidebarShortcutState,
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
          </AppShortcutsContext.Provider>
        </QuizPreferencesContext.Provider>
      </UiPreferencesContext.Provider>
    </UserProfileContext.Provider>
  );
}
