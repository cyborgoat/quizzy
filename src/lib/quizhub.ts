import type {
  HubDownloadReport,
  HubInstalledItem,
  HubItem,
  HubItemRef,
  HubItemState,
  HubKind,
} from "@/lib/native";

/** Matches the Rust `DEFAULT_BASE_URL` in hub_sync. Empty settings reset to this. */
export const QUIZHUB_DEFAULT_BASE_URL = "https://cyborgoat.github.io/quizhub/";

export const QUIZHUB_CHANGED_EVENT = "quizzy:quizhub-changed";

export function notifyQuizhubChanged() {
  window.dispatchEvent(new Event(QUIZHUB_CHANGED_EVENT));
}

export function hubItemKey(item: HubItemRef) {
  return `${item.kind}/${item.id}`;
}

export const hubStateLabel: Record<HubItemState, string> = {
  available: "Not downloaded",
  nameTaken: "Name in use",
  installed: "Downloaded",
  updateAvailable: "Update available",
  modifiedLocally: "Edited locally",
  removedRemotely: "Removed from hub",
};

export const hubStateDescription: Record<HubItemState, string> = {
  available: "Available to download.",
  nameTaken: "A local file with the same name already exists. It will not be replaced unless you choose to.",
  installed: "Your copy matches quizhub.",
  updateAvailable: "A newer version is published. Your copy has not been edited, so it can be updated safely.",
  modifiedLocally: "You edited this file after downloading it. Updates are skipped to keep your changes.",
  removedRemotely: "Quizhub no longer publishes this item. Your copy is kept.",
};

/** States a plain "Download" can act on without overwriting anything the user owns. */
export function isDownloadable(state: HubItemState) {
  return state === "available" || state === "updateAvailable";
}

/** States where the item came from quizhub and its file is still local. */
export function isFromHub(state: HubItemState) {
  return (
    state === "installed" ||
    state === "updateAvailable" ||
    state === "modifiedLocally" ||
    state === "removedRemotely"
  );
}

export type HubCategoryView = {
  id: string;
  title: string;
  items: HubItem[];
  quizCount: number;
  noteCount: number;
  downloadedCount: number;
  updateCount: number;
};

/** Groups catalog items by category, keeping manifest category order; unknown categories go last. */
export function groupHubItems(
  categories: { id: string; title: string }[],
  items: HubItem[],
): HubCategoryView[] {
  const views = new Map<string, HubCategoryView>();
  const ensure = (id: string, title: string) => {
    let view = views.get(id);
    if (!view) {
      view = { id, title, items: [], quizCount: 0, noteCount: 0, downloadedCount: 0, updateCount: 0 };
      views.set(id, view);
    }
    return view;
  };
  for (const category of categories) ensure(category.id, category.title);
  for (const item of items) {
    const view = ensure(item.category, item.category);
    view.items.push(item);
    if (item.kind === "quiz") view.quizCount += 1;
    else view.noteCount += 1;
    if (isFromHub(item.state)) view.downloadedCount += 1;
    if (item.state === "updateAvailable") view.updateCount += 1;
  }
  for (const view of views.values()) {
    view.items.sort(
      (a, b) => kindOrder(a.kind) - kindOrder(b.kind) || a.title.localeCompare(b.title),
    );
  }
  return [...views.values()];
}

function kindOrder(kind: HubKind) {
  return kind === "quiz" ? 0 : 1;
}

export function filterHubItems(items: HubItem[], query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return items;
  return items.filter(
    (item) =>
      item.title.toLowerCase().includes(needle) ||
      item.id.toLowerCase().includes(needle) ||
      item.tags.some((tag) => tag.toLowerCase().includes(needle)),
  );
}

export function summarizeHubReport(report: HubDownloadReport) {
  const parts: string[] = [];
  if (report.added) parts.push(`${report.added} added`);
  if (report.updated) parts.push(`${report.updated} updated`);
  if (report.unchanged) parts.push(`${report.unchanged} already up to date`);
  if (report.skipped) parts.push(`${report.skipped} skipped`);
  if (report.failed) parts.push(`${report.failed} failed`);
  return parts.length ? parts.join(", ") : "Nothing to do";
}

/** File names of downloaded items, per kind, for marking library entries. */
export function installedFileNames(items: HubInstalledItem[]) {
  const quizzes = new Set<string>();
  const notes = new Set<string>();
  for (const item of items) {
    (item.kind === "quiz" ? quizzes : notes).add(item.fileName);
  }
  return { quizzes, notes };
}

export function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
