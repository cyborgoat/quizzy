import { describe, expect, it, vi } from "vitest";
import { createSettingsSaveQueue } from "@/lib/settingsSaveQueue";

describe("settingsSaveQueue", () => {
  it("serializes partial settings writes", async () => {
    const events: string[] = [];
    let releaseFirst!: () => void;
    const firstPending = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const save = vi.fn(async (request: { profileName?: string }) => {
      const name = request.profileName ?? "unknown";
      events.push(`start:${name}`);
      if (name === "first") await firstPending;
      events.push(`finish:${name}`);
    });
    const enqueue = createSettingsSaveQueue(save);

    const first = enqueue({ profileName: "first" });
    const second = enqueue({ profileName: "second" });
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
      .fn<(request: { profileName?: string }) => Promise<void>>()
      .mockRejectedValueOnce(new Error("failed"))
      .mockResolvedValueOnce();
    const enqueue = createSettingsSaveQueue(save);

    await expect(enqueue({ profileName: "first" })).rejects.toThrow("failed");
    await expect(enqueue({ profileName: "second" })).resolves.toBeUndefined();
    expect(save).toHaveBeenCalledTimes(2);
  });
});
