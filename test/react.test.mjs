import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FileIcon } from "@pitant-industries/file-icons/react";

test("renders SVG inline during SSR and hides decorative icons", () => {
  const svg = renderToStaticMarkup(
    createElement(FileIcon, { filename: "part.STP", size: 32, className: "attachment-icon" }),
  );
  assert.match(svg, /^<svg /u);
  assert.match(svg, /viewBox="0 0 64 64" width="32" height="32"/u);
  assert.match(svg, /class="attachment-icon"/u);
  assert.match(svg, /aria-hidden="true"/u);
  assert.match(svg, /fill="#275FD0"/u);
  assert.doesNotMatch(svg, /<use |<image |role="img"|<title/u);
});

test("supports accessible titles, explicit labels and currentColor artwork", () => {
  const titleIcon = () => createElement(FileIcon, { format: "zip", title: "Compressed archive" });
  const rendered = renderToStaticMarkup(createElement("span", null, titleIcon(), titleIcon()));
  const labels = [...rendered.matchAll(/aria-labelledby="([^"]+)"><title id="([^"]+)">Compressed archive<\/title>/gu)];
  assert.equal(labels.length, 2);
  assert.equal(labels[0][1], labels[0][2]);
  assert.equal(labels[1][1], labels[1][2]);
  assert.notEqual(labels[0][1], labels[1][1]);
  assert.match(rendered, /role="img"/u);
  assert.doesNotMatch(rendered, /aria-hidden/u);

  const mono = renderToStaticMarkup(
    createElement(FileIcon, {
      format: "pdf",
      size: "1em",
      variant: "monochrome",
      "aria-label": "PDF",
      "aria-labelledby": "external-label",
    }),
  );
  assert.match(mono, /width="1em" height="1em"/u);
  assert.match(mono, /role="img" aria-label="PDF" aria-labelledby="external-label"/u);
  assert.match(mono, /stroke="currentColor"/u);
  assert.match(mono, /fill="currentColor"/u);
  assert.doesNotMatch(mono, /(?:stroke|fill)="#/u);
});
