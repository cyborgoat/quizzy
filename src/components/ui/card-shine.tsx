/** Faint diagonal light sweep for a `group relative` card; plays once on hover. */
export function CardShine({ rounded = "rounded-xl" }: { rounded?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${rounded}`}
    >
      <span className="absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 -translate-x-full bg-gradient-to-r from-transparent via-zinc-900/[0.04] to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[300%]" />
    </span>
  );
}
