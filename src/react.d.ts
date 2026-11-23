import type { ComponentPropsWithoutRef, ReactElement } from "react";
import type { FileIconId } from "./index.js";

type IconSource =
  | { readonly filename: string; readonly format?: never }
  | { readonly format: FileIconId; readonly filename?: never }
  | { readonly filename?: never; readonly format?: never };

export type FileIconProps = IconSource &
  Omit<
    ComponentPropsWithoutRef<"svg">,
    "children" | "dangerouslySetInnerHTML" | "width" | "height" | "viewBox" | "title" | "role" | "aria-hidden"
  > & {
    readonly size?: number | string;
    readonly title?: string;
    readonly variant?: "color" | "monochrome";
  };

export function FileIcon(props: FileIconProps): ReactElement;
