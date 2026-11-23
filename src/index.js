import catalog from "./formats.js";

function deepFreeze(value) {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }

  return value;
}

export const formats = deepFreeze(catalog);

const icons = new Map(formats.icons.map((icon) => [icon.id, icon]));
const filenames = new Map(Object.entries(formats.filenameMap));
const extensions = new Map(Object.entries(formats.extensionMap));
const fallback = icons.get(formats.fallback);

export function getFileIcon(id) {
  return icons.get(id);
}

export function resolveFileIcon(filename) {
  const basename = (filename.split(/[\\/]/u).at(-1) ?? "").trim().toLowerCase();
  const namedIcon = filenames.get(basename);
  if (namedIcon !== undefined) return icons.get(namedIcon);

  // Starting at the first separator prefers compound suffixes and skips a leading dot.
  for (let dot = basename.indexOf(".", 1); dot !== -1; dot = basename.indexOf(".", dot + 1)) {
    const icon = extensions.get(basename.slice(dot + 1));
    if (icon !== undefined) return icons.get(icon);
  }

  return fallback;
}

export function fileIconSymbolId(id) {
  return `pitant-file-${(icons.get(id) ?? fallback).id}`;
}
