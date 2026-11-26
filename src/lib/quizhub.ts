import type {
  HubDomain,
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
  installed: "Downloaded",
  updateAvailable: "Update available",
  removedRemotely: "Removed from hub",
};

export const hubStateDescription: Record<HubItemState, string> = {
  available: "Available to download.",
  installed: "This item is recorded as downloaded.",
  updateAvailable: "A newer version is available. QuizHub checks your local file when you update.",
  removedRemotely: "Quizhub no longer publishes this item. Your copy is kept.",
};

/** Items eligible for row and bulk downloads. */
export function isDownloadable(state: HubItemState) {
  return state === "available" || state === "updateAvailable";
}

/** States where the item came from quizhub and its file is still local. */
export function isFromHub(state: HubItemState) {
  return (
    state === "installed" ||
    state === "updateAvailable" ||
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

type HubCategoryInfo = Pick<HubCategoryView, "id" | "title"> & { domain: string };
export type HubDomainView = HubDomain & { categories: HubCategoryView[] };

export const REMOVED_HUB_CATEGORY = "__removed_from_quizhub__";

export function groupHubItems(
  categories: HubCategoryInfo[],
  items: HubItem[],
): HubCategoryView[] {
  const views = new Map<string, HubCategoryView>();
  const addCategory = (id: string, title: string) => {
    const view = { id, title, items: [], quizCount: 0, noteCount: 0, downloadedCount: 0, updateCount: 0 };
    views.set(id, view);
    return view;
  };
  for (const category of categories) addCategory(category.id, category.title);
  for (const item of items) {
    let view = views.get(item.category);
    if (!view && item.state === "removedRemotely") {
      view = views.get(REMOVED_HUB_CATEGORY) ?? addCategory(REMOVED_HUB_CATEGORY, "Removed from QuizHub");
    }
    if (!view) continue;

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

export function groupHubDomains(
  domains: HubDomain[],
  categories: HubCategoryInfo[],
  items: HubItem[],
) {
  const domainViews = new Map<string, HubDomainView>(
    domains.map((domain) => [domain.id, { ...domain, categories: [] }]),
  );
  const categoryDomains = new Map(categories.map((category) => [category.id, category.domain]));
  const categoryViews = groupHubItems(categories, items);
  for (const category of categoryViews) {
    const domainId = categoryDomains.get(category.id);
    if (domainId) domainViews.get(domainId)?.categories.push(category);
  }
  return {
    domains: [...domainViews.values()].filter((domain) => domain.categories.length > 0),
    removed: categoryViews.find((category) => category.id === REMOVED_HUB_CATEGORY),
  };
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

export function summarizeHubReport(report: Omit<HubDownloadReport, "conflicts">) {
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
