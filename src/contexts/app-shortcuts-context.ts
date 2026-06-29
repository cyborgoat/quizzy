import { createContext } from "react";
import type { Keybind } from "@/lib/keybinds";

export type AppShortcutsContextValue = {
  knowledgeLink: Keybind;
  knowledgeNewNote: Keybind;
  zoomIn: Keybind;
  zoomOut: Keybind;
  toggleSidebar: Keybind;
  setKnowledgeLink: (shortcut: string) => void;
  setKnowledgeNewNote: (shortcut: string) => void;
  setZoomIn: (shortcut: string) => void;
  setZoomOut: (shortcut: string) => void;
  setToggleSidebar: (shortcut: string) => void;
};

export const AppShortcutsContext = createContext<AppShortcutsContextValue | null>(null);
