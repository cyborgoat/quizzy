import { describe, expect, it } from "vitest";
import { QUIZHUB_DEFAULT_BASE_URL } from "@/lib/quizhub";
import {
  draftFromPersisted,
  validateNumericSetting,
  validateShortcutSettings,
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
    expect(validateNumericSetting("maxCorrectness", "120")).toEqual({
      ok: false,
      error: "settings.validation.percent",
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
