import { describe, expect, it, vi } from "vitest";
import { createSettingsSaveQueue } from "@/lib/settingsSaveQueue";

describe("settingsSaveQueue", () => {
  it("serializes partial settings writes", async () => {
    const events: string[] = [];
    let releaseFirst!: () => void;
    const firstPending = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const save = vi.fn(async (request: { shuffleQuestions?: boolean }) => {
      const label = request.shuffleQuestions ? "first" : "second";
      events.push(`start:${label}`);
      if (label === "first") await firstPending;
      events.push(`finish:${label}`);
    });
    const enqueue = createSettingsSaveQueue(save);

    const first = enqueue({ shuffleQuestions: true });
    const second = enqueue({ shuffleQuestions: false });
    await Promise.resolve();

    expect(events).toEqual(["start:first"]);
    releaseFirst();
    await Promise.all([first, second]);
    expect(events).toEqual([
      "start:first",
      "finish:first",
      "start:second",
      "finish:second",
    ]);
  });

  it("continues after a failed write", async () => {
    const save = vi
      .fn<(request: { shuffleQuestions?: boolean }) => Promise<void>>()
      .mockRejectedValueOnce(new Error("failed"))
      .mockResolvedValueOnce();
    const enqueue = createSettingsSaveQueue(save);

    await expect(enqueue({ shuffleQuestions: true })).rejects.toThrow("failed");
    await expect(enqueue({ shuffleQuestions: false })).resolves.toBeUndefined();
    expect(save).toHaveBeenCalledTimes(2);
  });
});
