import { describe, expect, it } from "vitest";
import {
  draftFromPersisted,
  hasSettingsChanges,
  toSaveSettingsRequest,
  validateSettingsDraft,
} from "@/lib/settingsDraft";

const persistedSnapshot = {
  userName: "Alex",
  shuffleQuestions: false,
  shuffleOptions: true,
  minMistakes: 2,
  minFlags: 1,
  maxCorrectnessPercentage: 40,
  knowledgeLinkShortcut: "mod+l",
  knowledgeNewNoteShortcut: "mod+n",
  zoomInShortcut: "mod+=",
  zoomOutShortcut: "mod+-",
  toggleSidebarShortcut: "mod+b",
};

describe("settingsDraft", () => {
  it("builds a draft from persisted settings", () => {
    expect(draftFromPersisted(persistedSnapshot)).toEqual({
      name: "Alex",
      shuffleQuestions: false,
      shuffleOptions: true,
      minMistakes: "2",
      minFlags: "1",
      maxCorrectness: "40",
      knowledgeLinkShortcut: "mod+l",
      knowledgeNewNoteShortcut: "mod+n",
      zoomInShortcut: "mod+=",
      zoomOutShortcut: "mod+-",
      toggleSidebarShortcut: "mod+b",
      pendingDir: null,
    });
  });

  it("detects draft changes including pending directory", () => {
    const persisted = draftFromPersisted(persistedSnapshot);
    const unchanged = { ...persisted };
    const changedName = { ...persisted, name: "Sam" };
    const pendingDir = { ...persisted, pendingDir: "/tmp/quizzy" };

    expect(hasSettingsChanges(unchanged, persisted)).toBe(false);
    expect(hasSettingsChanges(changedName, persisted)).toBe(true);
    expect(hasSettingsChanges(pendingDir, persisted)).toBe(true);
  });

  it("returns parsed values when the draft is valid", () => {
    const draft = draftFromPersisted(persistedSnapshot);
    const result = validateSettingsDraft(draft);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.parsed).toEqual({
        name: "Alex",
        shuffleQuestions: false,
        shuffleOptions: true,
        minMistakes: 2,
        minFlags: 1,
        maxCorrectness: 40,
        knowledgeLinkShortcut: "mod+l",
        knowledgeNewNoteShortcut: "mod+n",
        zoomInShortcut: "mod+=",
        zoomOutShortcut: "mod+-",
        toggleSidebarShortcut: "mod+b",
        pendingDir: null,
      });
    }
  });

  it("maps parsed settings to a save request", () => {
    const draft = draftFromPersisted(persistedSnapshot);
    const result = validateSettingsDraft(draft);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(toSaveSettingsRequest(result.parsed)).toEqual({
      profileName: "Alex",
      shuffleQuestions: false,
      shuffleOptions: true,
      mistakeLogMinMistakes: 2,
      mistakeLogMinFlags: 1,
      mistakeLogMaxCorrectnessPercentage: 40,
      knowledgeLinkShortcutKey: "mod+l",
      knowledgeNewNoteShortcutKey: "mod+n",
      zoomInShortcutKey: "mod+=",
      zoomOutShortcutKey: "mod+-",
      toggleSidebarShortcutKey: "mod+b",
    });
  });

  it("returns field errors when threshold values are invalid", () => {
    const draft = {
      ...draftFromPersisted(persistedSnapshot),
      minMistakes: "0",
      minFlags: "x",
      maxCorrectness: "120",
    };
    const result = validateSettingsDraft(draft);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.minMistakes).toBeTruthy();
      expect(result.errors.minFlags).toBeTruthy();
      expect(result.errors.maxCorrectness).toBeTruthy();
    }
  });
});
