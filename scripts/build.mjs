import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const dist = new URL("dist/", root);
const iconDirectory = new URL("icons/", root);
const formats = JSON.parse(await readFile(new URL("formats.json", root), "utf8"));
const iconIds = formats.icons.map(({ id }) => id);
const knownIds = new Set(iconIds);

if (
  knownIds.size !== iconIds.length ||
  !knownIds.has(formats.fallback) ||
  [...Object.values(formats.extensionMap), ...Object.values(formats.filenameMap)].some(
    (id) => !knownIds.has(id),
  )
) {
  throw new Error("The icon catalog contains a duplicate or unknown ID.");
}

const sourceFiles = (await readdir(iconDirectory)).filter((name) => name.endsWith(".svg"));
if (
  sourceFiles.length !== knownIds.size ||
  sourceFiles.some((name) => !knownIds.has(name.slice(0, -4)))
) {
  throw new Error("The icon catalog and the SVG directory must contain the same IDs.");
}

const svgHeader = /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="64" height="64" viewBox="0 0 64 64" role="img" aria-label="[^<>"]+">$/u;

const pathAttributes = {
  d: "d",
  fill: "fill",
  "fill-rule": "fillRule",
  transform: "transform",
};

function readPath(line, id) {
  const match = /^<path ((?:[a-z-]+="[^"<>&]+" ?)+)\/>$/u.exec(line);
  if (match === null) throw new Error(`Unexpected SVG path in ${id}.`);

  const path = {};
  for (const [, attribute, value] of match[1].matchAll(/([a-z-]+)="([^"]*)"/gu)) {
    if (
      !Object.hasOwn(pathAttributes, attribute) ||
      Object.hasOwn(path, pathAttributes[attribute])
    ) {
      throw new Error(`Unexpected SVG path attribute ${attribute} in ${id}.`);
    }
    path[pathAttributes[attribute]] = value;
  }

  if (!path.d || !/^#(?:[\da-f]{3}|[\da-f]{6})$/iu.test(path.fill)) {
    throw new Error(`Missing SVG geometry or hex fill in ${id}.`);
  }
  return path;
}

async function readArtwork({ id, path }) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(id) || path !== `icons/${id}.svg`) {
    throw new Error(`Invalid catalog path for ${id}.`);
  }

  const svg = await readFile(new URL(path, root), "utf8");
  const lines = svg.trim().split(/\r?\n/u).map((line) => line.trim());
  const [open, title, description, ...paths] = lines;
  if (
    !svgHeader.test(open) ||
    !/^<title>[^<>]+<\/title>$/u.test(title) ||
    !/^<desc>[^<>]+<\/desc>$/u.test(description) ||
    paths.pop() !== "</svg>" ||
    paths.length !== 3
  ) {
    throw new Error(`Unexpected SVG structure in ${id}.`);
  }
  return paths.map((line) => readPath(line, id));
}

const paths = await Promise.all(formats.icons.map(readArtwork));
const body = paths[0][0].d;
const fold = paths[0][1].d;
const foldVertices = /^M([\d.]+) 0 ([\d.]+) ([\d.]+)H\1Z$/u.exec(fold);
if (foldVertices === null) throw new Error("The folded corner geometry is unsupported.");
const [, foldX, rightX, foldY] = foldVertices;

const monochrome = {
  transform: "translate(2 2) scale(0.9375)",
  outline: {
    d: body,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.5",
    strokeLinejoin: "round",
  },
  fold: {
    d: `M${foldX} 0V${foldY}H${rightX}`,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.5",
    strokeLinejoin: "round",
  },
};

const icons = Object.fromEntries(
  iconIds.map((id, index) => {
    const [page, corner, foreground] = paths[index];
    if (
      page.d !== body ||
      corner.d !== fold ||
      Object.keys(page).length !== 2 ||
      Object.keys(corner).length !== 2
    ) {
      throw new Error(`Page or fold geometry differs for ${id}.`);
    }
    return [id, { bodyFill: page.fill, foldFill: corner.fill, foreground }];
  }),
);

function svgPath(attributes) {
  const values = Object.entries(attributes)
    .map(([name, value]) => {
      const svgName = name.replace(/[A-Z]/gu, (letter) => `-${letter.toLowerCase()}`);
      return `${svgName}="${value}"`;
    })
    .join(" ");
  return `<path ${values}/>`;
}

function sprite(renderArt) {
  const symbols = Object.entries(icons).map(
    ([id, art]) =>
      `  <symbol id="pitant-file-${id}" viewBox="0 0 64 64">${renderArt(art)}</symbol>`,
  );
  return `<svg xmlns="http://www.w3.org/2000/svg">\n${symbols.join("\n")}\n</svg>\n`;
}

function colorIcon({ bodyFill, foldFill, foreground }) {
  return [
    svgPath({ fill: bodyFill, d: body }),
    svgPath({ fill: foldFill, d: fold }),
    svgPath(foreground),
  ].join("");
}

function monochromeIcon({ foreground }) {
  const outline = svgPath(monochrome.outline);
  const foldedCorner = svgPath(monochrome.fold);
  const ink = svgPath({ ...foreground, fill: "currentColor" });
  return `<g transform="${monochrome.transform}">${outline}${foldedCorner}${ink}</g>`;
}

function union(name, values) {
  return `export type ${name} =\n${values.map((value) => `  | ${JSON.stringify(value)}`).join("\n")};\n`;
}

await mkdir(dist, { recursive: true });
await Promise.all([
  ...["index.js", "index.d.ts", "react.js", "react.d.ts"].map((file) =>
    copyFile(new URL(`src/${file}`, root), new URL(file, dist)),
  ),
  writeFile(new URL("formats.js", dist), `export default ${JSON.stringify(formats)};\n`),
  writeFile(new URL("artwork.js", dist), `export default ${JSON.stringify({ body, fold, monochrome, icons })};\n`),
  writeFile(
    new URL("ids.d.ts", dist),
    union("FileIconId", iconIds) + union("FileIconCategoryId", formats.categories.map(({ id }) => id)),
  ),
  writeFile(new URL("sprite.svg", dist), sprite(colorIcon)),
  writeFile(new URL("sprite-monochrome.svg", dist), sprite(monochromeIcon)),
]);

process.stderr.write(`Built ${iconIds.length} file format icons and two SVG sprites.\n`);
