/** Case-insensitive filename comparison for cross-platform quiz file matching. */
export function sameFileName(left: string, right: string) {
  return left.localeCompare(right, undefined, { sensitivity: "accent" }) === 0;
}
