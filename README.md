# PITANT File Icons

File-format icons for attachment rows, file browsers, engineering handoffs, and design tools. The library includes 289 designs across 18 categories, from STEP, KiCad, and Gerber to telemetry, PDF, Office, media, and archives.

![Eight PITANT file format icons including PDF, ISO, ZIP, and STEP](docs/preview.svg)

[Browse the icon catalog](https://pitant-industries.github.io/pitant-file-icons/) · [Download the latest release](https://github.com/PITANT-Industries/pitant-file-icons/releases/latest) · [MIT License](LICENSE)

## Choose a format for your project

| Use case | What to use |
| --- | --- |
| Design tools, desktop apps, print, and static sites | [Standalone SVGs](icons), or the SVG ZIP from a [release](https://github.com/PITANT-Industries/pitant-file-icons/releases) |
| Web interfaces with many repeated icons | `sprite.svg` for the original colors or `sprite-monochrome.svg` to inherit the surrounding text color |
| React, including server rendering | The `FileIcon` component from `@pitant-industries/file-icons/react` |
| Selecting an icon from an uploaded filename | `resolveFileIcon()` in JavaScript and TypeScript, or the portable [file-format manifest](formats.json) |

The standalone SVGs have a transparent 64 × 64 viewBox and outlined lettering. Use 32 px or more if the icon label must be readable. Show the filename alongside the icon in dense lists, especially for compressed archives, which share the gold zipper design.

## Install the package

Install the package tarball attached to the GitHub release. It contains the SVGs, both sprites, the JavaScript modules, and TypeScript declarations.

```sh
npm install https://github.com/PITANT-Industries/pitant-file-icons/releases/download/v0.1.0/pitant-industries-file-icons-0.1.0.tgz
```

## Standalone SVG and HTML

Copy an SVG from `icons/` into your project's static assets. Design tools can import the same SVG. Keep the companion [license](LICENSE) with redistributed assets.

```html
<img src="/assets/file-icons/step.svg" width="32" height="32" alt="">
<span>Housing.STP</span>
```

Use an empty `alt` when the adjacent filename already identifies the file. Give an icon-only control an accessible name that describes the action and the file.

## Resolve a filename

```js
import { getFileIcon, resolveFileIcon } from '@pitant-industries/file-icons';

resolveFileIcon('Housing.STP').id;       // 'step'
resolveFileIcon('release.tar.gz').id;    // 'tgz'
resolveFileIcon('notes.unlisted').id;    // 'file'
getFileIcon('odb-plus-plus')?.path;      // 'icons/odb-plus-plus.svg'
```

Matching is case-insensitive. Known filenames like `Dockerfile` are checked first, followed by the longest matching extension. The generic file icon handles unknown extensions and ambiguous extensions without a default. A known format can use its explicit icon ID. For example, select `pdf-a` when metadata identifies a PDF/A document.

## React

`FileIcon` renders inline SVG with no requests for icon assets. Pass a filename for automatic matching, or pass `format` when you already know the icon ID. `size` controls the width and height. Use `title` when the icon is the only visual label, and use `variant="monochrome"` to inherit the surrounding text color.

```jsx
import { FileIcon } from '@pitant-industries/file-icons/react';

export function Attachment({ filename }) {
  return (
    <span className="attachment">
      <FileIcon filename={filename} size={32} />
      {filename}
    </span>
  );
}
```

## SVG sprites

Copy a sprite from the release to your application's static assets. Sprite symbols use `pitant-file-<id>`, which you can also get from `fileIconSymbolId(id)`. Use the same origin for the page and the sprite.

```html
<svg width="32" height="32" aria-hidden="true">
  <use href="/assets/file-icons/sprite.svg#pitant-file-pdf"></use>
</svg>
<span>Inspection.pdf</span>
```

## Develop and contribute

```sh
npm ci
npm test
npm run build:site
python3 -m http.server 8000 --directory _site
```

Open `http://localhost:8000`. `npm run build` generates the package and sprites in `dist/`. See [contributing](CONTRIBUTING.md) for artwork and extension conventions, the [changelog](CHANGELOG.md) for release history, and the [release guide](docs/releasing.md) for how to build the downloads.

PITANT File Icons is released under the [MIT License](LICENSE). The artwork includes lettering set in [Geist](https://github.com/vercel/geist-font) and converted to SVG paths.
