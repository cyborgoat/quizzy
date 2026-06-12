export type DialogSize = {
  width: number;
  height: number;
};

export const DIALOG_VIEWPORT_MARGIN = 16;
export const DIALOG_MIN_WIDTH = 360;
export const DIALOG_MIN_HEIGHT = 280;

export type DialogSizeConstraints = {
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  defaultWidth?: number;
  defaultHeight?: number;
  margin?: number;
  viewportWidth?: number;
  viewportHeight?: number;
};

export function getDialogSizeLimits(constraints: DialogSizeConstraints = {}) {
  const margin = constraints.margin ?? DIALOG_VIEWPORT_MARGIN;
  const viewportWidth =
    constraints.viewportWidth ??
    (typeof window === "undefined" ? 1280 : window.innerWidth);
  const viewportHeight =
    constraints.viewportHeight ??
    (typeof window === "undefined" ? 800 : window.innerHeight);
  const availableWidth = viewportWidth - margin * 2;
  const availableHeight = viewportHeight - margin * 2;
  const maxWidth = constraints.maxWidth
    ? Math.min(constraints.maxWidth, availableWidth)
    : availableWidth;
  const maxHeight = constraints.maxHeight
    ? Math.min(constraints.maxHeight, availableHeight)
    : availableHeight;

  return {
    minWidth: constraints.minWidth ?? DIALOG_MIN_WIDTH,
    minHeight: constraints.minHeight ?? DIALOG_MIN_HEIGHT,
    maxWidth,
    maxHeight,
  };
}

export function getDefaultDialogSize(constraints: DialogSizeConstraints = {}): DialogSize {
  const limits = getDialogSizeLimits(constraints);
  return clampDialogSize(
    {
      width: constraints.defaultWidth ?? limits.maxWidth,
      height: constraints.defaultHeight ?? limits.maxHeight,
    },
    constraints,
  );
}

export function clampDialogSize(
  size: DialogSize,
  constraints: DialogSizeConstraints = {},
): DialogSize {
  const limits = getDialogSizeLimits(constraints);
  return {
    width: Math.max(limits.minWidth, Math.min(size.width, limits.maxWidth)),
    height: Math.max(limits.minHeight, Math.min(size.height, limits.maxHeight)),
  };
}

export function applyDialogResizeDelta(
  size: DialogSize,
  deltaWidth: number,
  deltaHeight: number,
  constraints: DialogSizeConstraints = {},
): DialogSize {
  return clampDialogSize(
    {
      width: size.width + deltaWidth,
      height: size.height + deltaHeight,
    },
    constraints,
  );
}

export const DEFAULT_RESIZABLE_DIALOG_SIZE_CONSTRAINTS = {
  maxWidth: 1536,
  defaultWidth: 1024,
};

export const KNOWLEDGE_NOTE_DIALOG_MARGIN = 32;
const KNOWLEDGE_NOTE_DIALOG_MAX_WIDTH = 2048;
const KNOWLEDGE_NOTE_DIALOG_MAX_HEIGHT = 1400;
const KNOWLEDGE_NOTE_DIALOG_DEFAULT_WIDTH_CAP = 1600;
const KNOWLEDGE_NOTE_DIALOG_DEFAULT_HEIGHT_CAP = 1000;

export function getKnowledgeNoteDialogSizeConstraints(viewport?: {
  width: number;
  height: number;
}): DialogSizeConstraints {
  const margin = KNOWLEDGE_NOTE_DIALOG_MARGIN;
  const viewportWidth =
    viewport?.width ?? (typeof window === "undefined" ? 1280 : window.innerWidth);
  const viewportHeight =
    viewport?.height ?? (typeof window === "undefined" ? 800 : window.innerHeight);

  const availableWidth = viewportWidth - margin * 2;
  const availableHeight = viewportHeight - margin * 2;

  return {
    margin,
    viewportWidth,
    viewportHeight,
    maxWidth: Math.min(KNOWLEDGE_NOTE_DIALOG_MAX_WIDTH, availableWidth),
    maxHeight: Math.min(KNOWLEDGE_NOTE_DIALOG_MAX_HEIGHT, availableHeight),
    defaultWidth: Math.min(
      KNOWLEDGE_NOTE_DIALOG_DEFAULT_WIDTH_CAP,
      Math.max(1024, Math.round(availableWidth * 0.65)),
    ),
    defaultHeight: Math.min(
      KNOWLEDGE_NOTE_DIALOG_DEFAULT_HEIGHT_CAP,
      Math.max(560, Math.round(availableHeight * 0.85)),
    ),
  };
}
