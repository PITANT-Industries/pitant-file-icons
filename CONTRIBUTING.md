# Contributing to PITANT File Icons

Open an [icon request](https://github.com/PITANT-Industries/pitant-file-icons/issues/new?template=icon_request.yml) for a format or extension we should cover. Include an example filename and a link to the format documentation where available. Use dummy names in examples.

## Add an icon or extension

1. Check `formats.json` for an existing design. Add an alias to that entry when the same design serves both extensions, as with STEP and STP.
2. For a distinct design, choose a lowercase kebab-case ID and add `icons/<id>.svg`. Start from a neighboring file and keep the artboard at `0 0 64 64`. The build expects a `<title>`, a `<desc>`, and exactly three paths for the page, fold, and foreground, in that order. Keep the page and fold path geometry identical to the template. Draw the label as one outline path, use hex fills, and keep font, image, and script dependencies out of the SVG.
3. Add the record to `formats.json` with its category and `icons/<id>.svg` path. Use lowercase extension keys with no leading period. Add unambiguous extensions to `extensionMap`. For collisions, record the competing IDs in `ambiguousExtensions` and choose a default only where the filename establishes a reasonable convention.
4. Check the color icon at 32 px and 64 px and run `npm ci`, `npm test`, and `npm run build:site`. Open `_site/index.html` through a local static server to inspect the catalog. The build regenerates the sprites and package output from the source SVGs.

Keep existing IDs and paths stable so application imports and sprite references keep working. In a pull request, list the IDs or aliases changed and show a preview for new artwork. Contributions use the [MIT License](LICENSE).
