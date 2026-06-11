export function questionLinkKey(quizId: string, questionId: string) {
  return `${quizId}:${questionId}`;
}

export function slugifyTitle(title: string) {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "untitled-note";
}

export function resolveUniqueFileName(
  baseSlug: string,
  existingFileNames: Set<string>,
) {
  const candidate = `${baseSlug}.md`;
  if (!existingFileNames.has(candidate)) {
    return { fileName: candidate, id: baseSlug };
  }

  let index = 2;
  while (existingFileNames.has(`${baseSlug}-${index}.md`)) {
    index += 1;
  }
  const slug = `${baseSlug}-${index}`;
  return { fileName: `${slug}.md`, id: slug };
}

export function fileNameStem(fileName: string) {
  return fileName.replace(/\.md$/i, "");
}
