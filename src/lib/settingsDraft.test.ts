import { describe, expect, it } from "vitest";
import { QUIZHUB_DEFAULT_BASE_URL } from "@/lib/quizhub";
import {
  draftFromPersisted,
  hasSettingsChanges,
  toSaveSettingsRequest,
  validateNumericSetting,
  validateShortcutSettings,
  validateSettingsDraft,
} from "@/lib/settingsDraft";

const persistedSnapshot = {
  shuffleQuestions: false,
  shuffleOptions: true,
  quizhubEnabled: false,
  quizhubBaseUrl: QUIZHUB_DEFAULT_BASE_URL,
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
      shuffleQuestions: false,
      shuffleOptions: true,
      quizhubEnabled: false,
      quizhubBaseUrl: QUIZHUB_DEFAULT_BASE_URL,
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
    const changedShuffle = { ...persisted, shuffleQuestions: true };
    const pendingDir = { ...persisted, pendingDir: "/tmp/quizzy" };

    expect(hasSettingsChanges(unchanged, persisted)).toBe(false);
    expect(hasSettingsChanges(changedShuffle, persisted)).toBe(true);
    expect(hasSettingsChanges(pendingDir, persisted)).toBe(true);
  });

  it("returns parsed values when the draft is valid", () => {
    const draft = draftFromPersisted(persistedSnapshot);
    const result = validateSettingsDraft(draft);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.parsed).toEqual({
        shuffleQuestions: false,
        shuffleOptions: true,
        quizhubEnabled: false,
        quizhubBaseUrl: QUIZHUB_DEFAULT_BASE_URL,
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
      shuffleQuestions: false,
      shuffleOptions: true,
      quizhubEnabled: false,
      quizhubBaseUrl: QUIZHUB_DEFAULT_BASE_URL,
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

  it("validates standalone numeric settings", () => {
    expect(validateNumericSetting("minMistakes", "2")).toEqual({ ok: true, value: 2 });
    expect(validateNumericSetting("minFlags", "0")).toEqual({
      ok: false,
      error: "settings.validation.minOne",
    });
    expect(validateNumericSetting("maxCorrectness", "40.5")).toEqual({
      ok: true,
      value: 40.5,
    });
  });

  it("validates shortcuts without depending on unrelated fields", () => {
    const draft = draftFromPersisted(persistedSnapshot);
    const valid = validateShortcutSettings(draft);
    expect(valid.ok).toBe(true);

    const duplicate = validateShortcutSettings({
      ...draft,
      zoomOutShortcut: draft.zoomInShortcut,
    });
    expect(duplicate.ok).toBe(false);
    if (!duplicate.ok) expect(duplicate.errors.zoomOutShortcut).toBeTruthy();
  });
});
