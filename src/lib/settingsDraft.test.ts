import { describe, expect, it } from "vitest";
import {
  draftFromPersisted,
  hasSettingsChanges,
  validateSettingsDraft,
} from "@/lib/settingsDraft";

const persistedSnapshot = {
  userName: "Alex",
  shuffleQuestions: false,
  shuffleOptions: true,
  fontSize: 100,
  density: "default" as const,
  minMistakes: 2,
  minFlags: 1,
  maxCorrectnessPercentage: 40,
};

describe("settingsDraft", () => {
  it("builds a draft from persisted settings", () => {
    expect(draftFromPersisted(persistedSnapshot)).toEqual({
      name: "Alex",
      shuffleQuestions: false,
      shuffleOptions: true,
      fontSize: "100",
      density: "default",
      minMistakes: "2",
      minFlags: "1",
      maxCorrectness: "40",
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
        fontSize: 100,
        density: "default",
        minMistakes: 2,
        minFlags: 1,
        maxCorrectness: 40,
        pendingDir: null,
      });
    }
  });

  it("returns field errors when threshold values are invalid", () => {
    const draft = {
      ...draftFromPersisted(persistedSnapshot),
      fontSize: "50",
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
