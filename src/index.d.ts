import type { FileIconCategoryId, FileIconId } from "./ids.js";

export type { FileIconCategoryId, FileIconId };

export interface FileIconCategory {
  readonly id: FileIconCategoryId;
  readonly name: string;
  readonly color: string;
  readonly description: string;
}

export interface FileIconMetadata {
  readonly id: FileIconId;
  readonly label: string;
  readonly name: string;
  readonly category: FileIconCategoryId;
  readonly extensions: readonly string[];
  readonly path: `icons/${FileIconId}.svg`;
  readonly color: string;
}

export interface FileIconCatalog {
  readonly version: number;
  readonly categories: readonly FileIconCategory[];
  readonly icons: readonly FileIconMetadata[];
  readonly fallback: FileIconId;
  readonly extensionMap: Readonly<Partial<Record<string, FileIconId>>>;
  readonly ambiguousExtensions: Readonly<
    Partial<Record<string, { readonly icons: readonly FileIconId[]; readonly default: FileIconId | null }>>
  >;
  readonly filenameMap: Readonly<Partial<Record<string, FileIconId>>>;
}

export const formats: FileIconCatalog;

export function getFileIcon(id: string): FileIconMetadata | undefined;

/** Resolve a filename or filesystem path, including compound suffixes. */
export function resolveFileIcon(filename: string): FileIconMetadata;

/** Return the same symbol ID for use with either generated sprite. */
export function fileIconSymbolId(id: string): `pitant-file-${FileIconId}`;
