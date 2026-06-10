export function formatIssue(path: PropertyKey[], message: string) {
  return path.length > 0 ? `${path.join(".")}: ${message}` : message;
}
