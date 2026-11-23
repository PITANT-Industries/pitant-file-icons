import {
  type FileIconId,
  type FileIconMetadata,
  fileIconSymbolId,
  formats,
  getFileIcon,
  resolveFileIcon,
} from "@pitant-industries/file-icons";
import { FileIcon, type FileIconProps } from "@pitant-industries/file-icons/react";

const id: FileIconId = "step";
const entry: FileIconMetadata | undefined = getFileIcon(id);
const resolved: FileIconId = resolveFileIcon("housing.STP").id;
const symbol: `pitant-file-${FileIconId}` = fileIconSymbolId(resolved);
const props: FileIconProps = { filename: "film.MP4", size: 24, variant: "monochrome" };
const rendered = <FileIcon {...props} aria-label={entry?.name} />;
const category = formats.icons[0]?.category;

export { category, rendered, symbol };

// @ts-expect-error The declared format must be a known icon ID.
const invalid = <FileIcon format="unknown-package-icon" />;
// @ts-expect-error Give an explicit icon ID or a filename.
const ambiguous = <FileIcon format="step" filename="movie.mp4" />;
void [invalid, ambiguous];
