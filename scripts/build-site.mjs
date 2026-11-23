import { cp, mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = join(root, 'site');
const destination = join(root, '_site');
const manifestPath = join(root, 'formats.json');
const placeholder = '__CATALOG_JSON__';

const [template, formats] = await Promise.all([
  readFile(join(source, 'index.html'), 'utf8'),
  readFile(manifestPath, 'utf8'),
]);
if (template.split(placeholder).length !== 2) throw new Error('The catalog page requires one manifest placeholder.');
const catalog = JSON.parse(formats);
for (const icon of catalog.icons) {
  if (!/^icons\/[a-z0-9][a-z0-9._-]*\.svg$/u.test(icon.path) || icon.path !== `icons/${icon.id}.svg`) {
    throw new Error(`Invalid catalog SVG path for ${icon.id}.`);
  }
}
const catalogData = JSON.stringify(catalog).replaceAll('<', '\\u003c');
const page = template.replace(placeholder, () => catalogData);

const staged = await mkdtemp(join(root, '.site-'));
try {
  await mkdir(join(staged, 'icons'));
  await Promise.all([
    ...catalog.icons.map(({ path }) => cp(join(root, path), join(staged, path))),
    cp(manifestPath, join(staged, 'formats.json')),
    cp(join(root, 'LICENSE'), join(staged, 'LICENSE')),
    cp(join(source, 'catalog.js'), join(staged, 'catalog.js')),
    cp(join(source, 'styles.css'), join(staged, 'styles.css')),
    writeFile(join(staged, 'index.html'), page),
    writeFile(join(staged, '.nojekyll'), ''),
  ]);
  await rm(destination, { recursive: true, force: true });
  await rename(staged, destination);
  console.log(`Built _site with ${catalog.icons.length} file-format icons.`);
} finally {
  await rm(staged, { recursive: true, force: true });
}
