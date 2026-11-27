import type {
  HubDomain,
  HubDownloadReport,
  HubInstalledItem,
  HubItem,
  HubItemRef,
  HubItemState,
  HubKind,
} from "@/lib/native";
import type { MessageKey, TFunction } from "@/lib/i18n-messages";

export const QUIZHUB_CHANGED_EVENT = "quizzy:quizhub-changed";

export function notifyQuizhubChanged() {
  window.dispatchEvent(new Event(QUIZHUB_CHANGED_EVENT));
}

export function hubItemKey(item: HubItemRef) {
  return `${item.kind}/${item.id}`;
}

export const hubStateLabelKey = {
  available: "hub.state.available",
  installed: "hub.state.installed",
  updateAvailable: "hub.state.updateAvailable",
  removedRemotely: "hub.state.removedRemotely",
} as const satisfies Record<HubItemState, MessageKey>;

export const hubStateDescriptionKey = {
  available: "hub.stateDescription.available",
  installed: "hub.stateDescription.installed",
  updateAvailable: "hub.stateDescription.updateAvailable",
  removedRemotely: "hub.stateDescription.removedRemotely",
} as const satisfies Record<HubItemState, MessageKey>;

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

function matchesHubNeedle(value: string, needle: string) {
  return value.toLowerCase().includes(needle);
}

export function filterHubCategories(categories: HubCategoryView[], query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return categories;
  return categories.filter(
    (category) =>
      matchesHubNeedle(category.title, needle) ||
      matchesHubNeedle(category.id, needle) ||
      filterHubItems(category.items, needle).length > 0,
  );
}

export function filterHubDomains(domains: HubDomainView[], query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return domains;
  return domains.filter((domain) => {
    if (matchesHubNeedle(domain.title, needle) || matchesHubNeedle(domain.id, needle)) {
      return true;
    }
    return filterHubCategories(domain.categories, needle).length > 0;
  });
}

export type HubSearchSuggestion =
  | {
      kind: "domain";
      id: string;
      domainId: string;
      title: string;
    }
  | {
      kind: "category";
      id: string;
      domainId: string;
      categoryId: string;
      title: string;
      subtitle: string;
    }
  | {
      kind: "item";
      id: string;
      domainId: string | null;
      categoryId: string;
      item: HubItem;
      title: string;
      subtitle: string;
    };

export function searchHubSuggestions(
  domains: HubDomainView[],
  query: string,
  options?: { limit?: number; removed?: HubCategoryView },
): HubSearchSuggestion[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  const limit = options?.limit ?? 10;
  const suggestions: HubSearchSuggestion[] = [];

  const push = (suggestion: HubSearchSuggestion) => {
    if (suggestions.length >= limit) return false;
    suggestions.push(suggestion);
    return true;
  };

  for (const domain of domains) {
    if (matchesHubNeedle(domain.title, needle) || matchesHubNeedle(domain.id, needle)) {
      if (
        !push({
          kind: "domain",
          id: `domain:${domain.id}`,
          domainId: domain.id,
          title: domain.title,
        })
      ) {
        return suggestions;
      }
    }
  }

  for (const domain of domains) {
    for (const category of domain.categories) {
      if (matchesHubNeedle(category.title, needle) || matchesHubNeedle(category.id, needle)) {
        if (
          !push({
            kind: "category",
            id: `category:${category.id}`,
            domainId: domain.id,
            categoryId: category.id,
            title: category.title,
            subtitle: domain.title,
          })
        ) {
          return suggestions;
        }
      }
    }
  }

  const catalogs: Array<{ domainId: string | null; domainTitle: string; category: HubCategoryView }> = [
    ...domains.flatMap((domain) =>
      domain.categories.map((category) => ({
        domainId: domain.id,
        domainTitle: domain.title,
        category,
      })),
    ),
  ];
  if (options?.removed) {
    catalogs.push({
      domainId: null,
      domainTitle: "",
      category: options.removed,
    });
  }

  for (const entry of catalogs) {
    for (const item of filterHubItems(entry.category.items, needle)) {
      const subtitle = entry.domainTitle
        ? `${entry.domainTitle} · ${entry.category.title}`
        : entry.category.title;
      if (
        !push({
          kind: "item",
          id: `item:${hubItemKey(item)}`,
          domainId: entry.domainId,
          categoryId: entry.category.id,
          item,
          title: item.title,
          subtitle,
        })
      ) {
        return suggestions;
      }
    }
  }

  return suggestions;
}

export function summarizeHubReport(
  report: Omit<HubDownloadReport, "conflicts">,
  t: TFunction,
) {
  const parts: string[] = [];
  if (report.added) parts.push(t("hub.report.added", { count: report.added }));
  if (report.updated) parts.push(t("hub.report.updated", { count: report.updated }));
  if (report.unchanged) parts.push(t("hub.report.unchanged", { count: report.unchanged }));
  if (report.skipped) parts.push(t("hub.report.skipped", { count: report.skipped }));
  if (report.failed) parts.push(t("hub.report.failed", { count: report.failed }));
  return parts.length ? parts.join(t("hub.report.separator")) : t("hub.report.nothing");
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
