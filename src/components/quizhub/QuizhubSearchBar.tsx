import { BookOpen, BookPlus, FolderOpen, SquareLetterQ } from "lucide-react";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { SearchField } from "@/components/ui/search-field";
import {
  searchHubSuggestions,
  type HubCategoryView,
  type HubDomainView,
  type HubSearchSuggestion,
} from "@/lib/quizhub";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type SuggestionMenuPosition = {
  top: number;
  left: number;
  width: number;
};

export function QuizhubSearchBar({
  value,
  onChange,
  pending = false,
  domains,
  removed,
  onSelect,
}: {
  value: string;
  onChange: (value: string) => void;
  pending?: boolean;
  domains: HubDomainView[];
  removed?: HubCategoryView;
  onSelect: (suggestion: HubSearchSuggestion) => void;
}) {
  const { t } = useI18n();
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [menuPosition, setMenuPosition] = useState<SuggestionMenuPosition | null>(null);

  const suggestions = useMemo(
    () => searchHubSuggestions(domains, value, { removed, limit: 10 }),
    [domains, removed, value],
  );

  const showSuggestions = open && value.trim().length > 0;
  const activeIndex =
    suggestions.length === 0
      ? -1
      : Math.min(Math.max(0, highlightedIndex), suggestions.length - 1);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [value]);

  useLayoutEffect(() => {
    if (!showSuggestions) {
      setMenuPosition(null);
      return;
    }

    function updatePosition() {
      const anchor = rootRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [showSuggestions, suggestions.length]);

  useEffect(() => {
    if (!showSuggestions || activeIndex < 0) return;
    optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, showSuggestions, suggestions]);

  useEffect(() => {
    if (!showSuggestions) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || listRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    }

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [showSuggestions]);

  function selectSuggestion(suggestion: HubSearchSuggestion) {
    setOpen(false);
    onSelect(suggestion);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      if (showSuggestions) {
        event.preventDefault();
        setOpen(false);
      }
      return;
    }

    if (!value.trim()) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      if (suggestions.length === 0) return;
      setHighlightedIndex(
        activeIndex < 0 ? 0 : Math.min(suggestions.length - 1, activeIndex + 1),
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      if (suggestions.length === 0) return;
      setHighlightedIndex(activeIndex <= 0 ? 0 : activeIndex - 1);
      return;
    }

    if (event.key === "Enter" && showSuggestions && activeIndex >= 0) {
      event.preventDefault();
      selectSuggestion(suggestions[activeIndex]!);
    }
  }

  return (
    <div ref={rootRef} className="relative w-full">
      <SearchField
        value={value}
        onChange={(next) => {
          onChange(next);
          setOpen(true);
        }}
        placeholder={t("hub.searchTopics")}
        pending={pending}
        className="w-full"
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showSuggestions}
        aria-controls={showSuggestions ? listboxId : undefined}
        aria-activedescendant={
          showSuggestions && activeIndex >= 0
            ? `${listboxId}-${suggestions[activeIndex]?.id}`
            : undefined
        }
        onFocus={() => {
          if (value.trim()) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
      />

      {showSuggestions &&
        menuPosition &&
        createPortal(
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            className="fixed z-50 max-h-72 overflow-y-auto rounded-xl border border-zinc-200 bg-white py-0.5 shadow-lg"
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
              width: menuPosition.width,
            }}
          >
            {suggestions.length === 0 ? (
              <li className="px-2.5 py-1.5 text-xs text-zinc-500">{t("hub.search.noSuggestions")}</li>
            ) : (
              suggestions.map((suggestion, index) => (
                <li key={suggestion.id} role="presentation">
                  <button
                    ref={(element) => {
                      optionRefs.current[index] = element;
                    }}
                    type="button"
                    id={`${listboxId}-${suggestion.id}`}
                    role="option"
                    aria-selected={index === activeIndex}
                    className={cn(
                      "flex w-full items-center gap-2 px-2.5 py-1.5 text-left hover:bg-zinc-50",
                      index === activeIndex && "bg-zinc-50",
                    )}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectSuggestion(suggestion)}
                  >
                    <SuggestionIcon suggestion={suggestion} />
                    <span className="min-w-0 flex-1 truncate text-sm text-zinc-950">
                      {suggestion.title}
                      <span className="text-zinc-400">
                        {" · "}
                        {suggestion.kind === "domain"
                          ? t("hub.search.domain")
                          : suggestion.subtitle}
                      </span>
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>,
          document.body,
        )}
    </div>
  );
}

function SuggestionIcon({ suggestion }: { suggestion: HubSearchSuggestion }) {
  const className = "size-3.5 shrink-0 text-zinc-400";
  if (suggestion.kind === "domain") {
    return <BookPlus className={className} aria-hidden="true" />;
  }
  if (suggestion.kind === "category") {
    return <FolderOpen className={className} aria-hidden="true" />;
  }
  if (suggestion.item.kind === "note") {
    return <BookOpen className={className} aria-hidden="true" />;
  }
  return <SquareLetterQ className={className} aria-hidden="true" />;
}
