"""Build the GitHub release downloads from the source tree."""

import argparse
from hashlib import sha256
import json
from pathlib import Path
from shutil import copyfile
from subprocess import check_output, run
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo


ROOT = Path(__file__).resolve().parents[1]
SPRITES = ("sprite.svg", "sprite-monochrome.svg")


def create_zip(target, release_name):
    with ZipFile(target, "w", compression=ZIP_DEFLATED, compresslevel=9) as archive:
        entries = [(path.relative_to(ROOT), path) for path in sorted((ROOT / "icons").glob("*.svg"))]
        entries.extend((Path(name), ROOT / name) for name in (
            "LICENSE", "README.md", "CONTRIBUTING.md", "CHANGELOG.md", "formats.json",
            "docs/preview.svg", "docs/releasing.md",
        ))
        entries.extend((Path(name), ROOT / "dist" / name) for name in SPRITES)
        for relative, source in entries:
            entry = ZipInfo.from_file(source, f"{release_name}/{relative.as_posix()}")
            entry.date_time = (1980, 1, 1, 0, 0, 0)
            archive.writestr(entry, source.read_bytes(), compress_type=ZIP_DEFLATED, compresslevel=9)


def package_release(destination):
    destination.mkdir(parents=True, exist_ok=True)
    package = json.loads((ROOT / "package.json").read_text())
    release_name = f"pitant-file-icons-{package['version']}"

    run(["npm", "run", "build"], cwd=ROOT, check=True)
    npm_result = check_output([
        "npm", "pack", "--json", "--ignore-scripts", "--pack-destination", str(destination),
    ], cwd=ROOT, text=True)
    npm_name = json.loads(npm_result)[0]["filename"]

    svg_zip = f"{release_name}.zip"
    create_zip(destination / svg_zip, release_name)
    for name in SPRITES:
        copyfile(ROOT / "dist" / name, destination / name)

    downloads = sorted([npm_name, svg_zip, *SPRITES])
    checksums = [f"{sha256((destination / name).read_bytes()).hexdigest()}  {name}" for name in downloads]
    (destination / "SHA256SUMS.txt").write_text("\n".join(checksums) + "\n")
    print(f"Created {len(downloads)} release downloads in {destination}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path, help="Output directory for release downloads")
    package_release(parser.parse_args().output.resolve())
