import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useKnowledgeLibrary } from "@/hooks/useKnowledgeLibrary";
import {
  applyTagSuggestion,
  collectKnowledgeTags,
  parseActiveTagFragment,
  searchKnowledgeTags,
} from "@/lib/knowledgeTags";
import { cn } from "@/lib/utils";

export function KnowledgeTagsInput({
  value,
  onChange,
  disabled = false,
  id = "detail-tags",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
}) {
  const { items } = useKnowledgeLibrary();
  const [focused, setFocused] = useState(false);
  const blurTimeoutRef = useRef<number | null>(null);

  const allTags = useMemo(() => collectKnowledgeTags(items), [items]);
  const { committed, fragment } = useMemo(() => parseActiveTagFragment(value), [value]);

  const suggestions = useMemo(
    () =>
      searchKnowledgeTags(allTags, fragment, {
        exclude: committed,
        limit: 8,
      }),
    [allTags, committed, fragment],
  );

  const showSuggestions =
    focused &&
    !disabled &&
    (fragment.length > 0 || value.includes(","));

  function clearBlurTimeout() {
    if (blurTimeoutRef.current !== null) {
      window.clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
  }

  function handleFocus() {
    clearBlurTimeout();
    setFocused(true);
  }

  function handleBlur() {
    blurTimeoutRef.current = window.setTimeout(() => {
      setFocused(false);
    }, 150);
  }

  function selectSuggestion(tag: string) {
    clearBlurTimeout();
    onChange(applyTagSuggestion(value, tag));
    setFocused(true);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && showSuggestions && suggestions.length > 0) {
      event.preventDefault();
      selectSuggestion(suggestions[0]!);
    }
  }

  return (
    <div className="relative">
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="e.g. react, hooks"
        disabled={disabled}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={showSuggestions}
        aria-controls={showSuggestions ? `${id}-suggestions` : undefined}
        className={className}
      />

      {showSuggestions && (
        <ul
          id={`${id}-suggestions`}
          role="listbox"
          className="absolute top-full z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-zinc-200 bg-white py-1 shadow-sm"
        >
          {suggestions.length === 0 ? (
            <li className="px-3 py-2 text-sm text-zinc-500">No matching tags.</li>
          ) : (
            suggestions.map((tag) => (
              <li key={tag} role="option">
                <button
                  type="button"
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm text-zinc-950 hover:bg-zinc-50",
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectSuggestion(tag)}
                >
                  {tag}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
