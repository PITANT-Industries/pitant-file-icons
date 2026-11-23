# Build and release

Use Node.js 22 or newer, npm, and Python 3. The published catalog and release packages build from the files in `icons/` and `formats.json`.

1. Update the package version, lockfile, changelog, and version in the README install command. Send the change through the normal review process.
2. At the release revision, run `npm ci`, `npm test`, `npm run build:site`, and `python3 scripts/package-release.py ./release-artifacts`.
3. Create and push an annotated `v<version>` tag for that revision. Create a GitHub Release from the verified tag and attach the files from `release-artifacts`. Attach the checksums alongside the individual downloads.

The SVG ZIP contains the source artwork, manifest, license and sprites. The `.tgz` is the installable npm package. Verify checksums in the download directory with `shasum -a 256 -c SHA256SUMS.txt`.

The catalog deploys through GitHub Pages from `main`. Run `npm run build:site` to generate a copy that can also be served by any static host under a subpath.
