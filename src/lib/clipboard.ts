export async function copyTextToClipboard(text: string) {
  if (!navigator.clipboard?.writeText) {
    throw new Error("Clipboard is not available in this environment.");
  }
  await navigator.clipboard.writeText(text);
}
