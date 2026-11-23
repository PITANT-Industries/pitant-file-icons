import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  fileIconSymbolId,
  formats,
  getFileIcon,
  resolveFileIcon,
} from "@pitant-industries/file-icons";
import rawCatalog from "@pitant-industries/file-icons/formats.json" with { type: "json" };

test("exposes catalog metadata and every authored icon", () => {
  assert.deepEqual(formats, rawCatalog);
  assert.equal(getFileIcon("step")?.path, "icons/step.svg");
  assert.equal(getFileIcon("file")?.name, "Generic file");
  assert.equal(getFileIcon("__proto__"), undefined);
  for (const icon of formats.icons) {
    assert.equal(getFileIcon(icon.id), icon);
    assert.doesNotThrow(() => import.meta.resolve(`@pitant-industries/file-icons/${icon.path}`));
  }
});

test("resolves exact names and case-insensitive compound suffixes", () => {
  const cases = {
    "WORKSTEP.STP": "step",
    "C:\\Drawings\\rear panel.Step": "step",
    "/machines/press_2/Reading.CsV": "csv",
    "video.revision.mp4": "mp4",
    "RELEASE.TAR.GZ": formats.extensionMap["tar.gz"],
    "capture.tar.xz": formats.extensionMap["tar.xz"],
    "bundle.other.js.map": formats.extensionMap["js.map"],
    " .ENV ": "env",
    "/build/Dockerfile": "dockerfile",
    "code.ts": "ts",
    "report.readmefileunknown": formats.fallback,
    " .profile ": formats.fallback,
    "directory/": formats.fallback,
    "readme": formats.fallback,
    "packet.key": formats.fallback,
    "": formats.fallback,
  };
  for (const [filename, id] of Object.entries(cases)) {
    assert.equal(resolveFileIcon(filename).id, id, filename);
  }
});

const pathMarkup = (markup) => [...markup.matchAll(/<path [^>]+\/>/gu)].map(([path]) => path);
const readExportedFile = (path) => readFile(new URL(import.meta.resolve(path)), "utf8");

test("sprites contain matching symbols and preserve the authored color geometry", async () => {
  const prefix = "@pitant-industries/file-icons";
  const [sprite, mono] = await Promise.all([
    readExportedFile(`${prefix}/sprite.svg`),
    readExportedFile(`${prefix}/sprite-monochrome.svg`),
  ]);
  const definitions = (asset) => new Map(
    [...asset.matchAll(/<symbol id="([^"]+)" viewBox="0 0 64 64">(.*?)<\/symbol>/gu)].map(
      ([, id, artwork]) => [id, artwork],
    ),
  );
  const colorSymbols = definitions(sprite);
  const monoSymbols = definitions(mono);
  assert.equal(colorSymbols.size, formats.icons.length);
  assert.deepEqual([...monoSymbols.keys()], [...colorSymbols.keys()]);
  assert.equal(fileIconSymbolId("unknown-id"), fileIconSymbolId(formats.fallback));
  await Promise.all(
    formats.icons.map(async (icon) => {
      const id = fileIconSymbolId(icon.id);
      const source = await readExportedFile(`${prefix}/${icon.path}`);
      assert.deepEqual(pathMarkup(colorSymbols.get(id)), pathMarkup(source), icon.id);
      assert.match(monoSymbols.get(id), /stroke="currentColor"/u);
      assert.match(monoSymbols.get(id), /fill="currentColor"/u);
      assert.doesNotMatch(monoSymbols.get(id), /(?:stroke|fill)="#/u);
    }),
  );
});
