import { createElement, useId } from "react";
import artwork from "./artwork.js";
import { formats, getFileIcon, resolveFileIcon } from "./index.js";

function svgPath(attributes, key) {
  return createElement("path", { ...attributes, key });
}

function renderArtwork(icon, variant) {
  const { bodyFill, foldFill, foreground } = artwork.icons[icon];

  if (variant === "monochrome") {
    const { outline, fold, transform } = artwork.monochrome;
    return createElement(
      "g",
      { transform },
      svgPath(outline, "page"),
      svgPath(fold, "fold"),
      svgPath({ ...foreground, fill: "currentColor" }, "glyph"),
    );
  }

  return [
    svgPath({ d: artwork.body, fill: bodyFill }, "page"),
    svgPath({ d: artwork.fold, fill: foldFill }, "fold"),
    svgPath(foreground, "glyph"),
  ];
}

export function FileIcon({
  filename,
  format,
  size = 24,
  title,
  variant = "color",
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...props
}) {
  const titleId = useId();
  const icon =
    format === undefined
      ? resolveFileIcon(filename ?? "")
      : (getFileIcon(format) ?? getFileIcon(formats.fallback));
  const hasTitle = Boolean(title?.trim());
  const decorative = !hasTitle && !ariaLabel && !ariaLabelledBy;

  return createElement(
    "svg",
    {
      ...props,
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 64 64",
      width: size,
      height: size,
      focusable: "false",
      role: decorative ? undefined : "img",
      "aria-hidden": decorative || undefined,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy || (hasTitle && !ariaLabel ? titleId : undefined),
    },
    hasTitle ? createElement("title", { id: titleId }, title) : null,
    renderArtwork(icon.id, variant),
  );
}
