'use strict';

const catalog = JSON.parse(document.querySelector('#catalog-data').textContent);
const { categories, icons, fallback } = catalog;
const categoryById = new Map(categories.map(category => [category.id, category]));
const iconById = new Map(icons.map(icon => [icon.id, icon]));
const extensionMap = new Map(Object.entries(catalog.extensionMap));
const filenameMap = new Map(Object.entries(catalog.filenameMap));
const ambiguousExtensions = new Map(Object.entries(catalog.ambiguousExtensions));
const search = document.querySelector('#format-search');
const categorySelect = document.querySelector('#category-select');
const sizeSelect = document.querySelector('#size-select');
const backgroundSelect = document.querySelector('#background-select');
const filters = document.querySelector('#category-buttons');
const results = document.querySelector('#format-results');
const resultCount = document.querySelector('#result-count');
const template = document.querySelector('#format-template');
const dialog = document.querySelector('#icon-dialog');
const copy = document.querySelector('#copy-svg');
const copyStatus = document.querySelector('#copy-status');
const copySource = document.querySelector('#copy-source');
const copyText = copySource.querySelector('textarea');
const filterButtons = new Map();
let selectedCategory = '';
let activeIcon;
let dialogTrigger;
let renderFrame;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function normalize(value) {
  return value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
}

function swatch(color) {
  const dot = element('span', 'swatch');
  dot.setAttribute('aria-hidden', 'true');
  if (color) dot.style.setProperty('--category-color', color);
  return dot;
}

const iconSearch = icons.map(icon => ({
  icon,
  label: normalize(icon.label),
  text: normalize([icon.name, icon.label, icon.id, ...icon.extensions, categoryById.get(icon.category).name].join(' ')),
}));
const knownSuffixes = [...new Set([
  ...extensionMap.keys(),
  ...ambiguousExtensions.keys(),
  ...icons.flatMap(icon => icon.extensions),
])].sort((first, second) => second.length - first.length);

function matchesFor(query) {
  const eligible = selectedCategory ? iconSearch.filter(({ icon }) => icon.category === selectedCategory) : iconSearch;
  if (!query) return eligible.map(({ icon }) => icon);
  const normalized = normalize(query);
  const filename = normalized.split(/[\\/]/u).at(-1);
  const named = filenameMap.get(filename);
  const suffix = knownSuffixes.find(value => filename === value || filename.endsWith(`.${value}`));
  const ambiguity = ambiguousExtensions.get(suffix);
  const canonical = named ?? extensionMap.get(suffix) ?? ambiguity?.default;
  const terms = normalized.replace(/^\./u, '').split(/\s+/u);
  const matches = [];

  for (const { icon, label, text } of eligible) {
    let rank;
    if (icon.id === canonical) rank = 0;
    else if (ambiguity?.icons.includes(icon.id) || icon.extensions.includes(suffix)) rank = 1;
    else if (icon.id === normalized || label === normalized) rank = 2;
    else if (terms.every(term => term && text.includes(term))) rank = 3;
    else continue;
    matches.push({ icon, rank });
  }
  return matches.sort((first, second) => first.rank - second.rank).map(({ icon }) => icon);
}

function iconExtensions(icon) {
  if (icon.extensions.length) return icon.extensions.map(extension => `.${extension}`);
  const filenames = [...filenameMap.entries()].filter(([, id]) => id === icon.id).map(([name]) => name);
  if (filenames.length) return filenames;
  return icon.id === fallback ? ['Generic fallback'] : ['Context-specific'];
}

function openDetails(icon, trigger) {
  activeIcon = icon;
  dialogTrigger = trigger;
  document.querySelector('#detail-image').src = icon.path;
  document.querySelector('#detail-category').textContent = categoryById.get(icon.category).name;
  document.querySelector('#icon-dialog-title').textContent = icon.name;
  document.querySelector('#detail-suffixes').textContent = iconExtensions(icon).join(', ');
  const download = document.querySelector('#download-svg');
  download.href = icon.path;
  download.download = `${icon.id}.svg`;
  document.querySelector('#open-svg').href = icon.path;
  copy.disabled = false;
  copyStatus.textContent = '';
  copySource.hidden = true;
  copyText.value = '';
  dialog.showModal();
}

async function copySvg() {
  const icon = activeIcon;
  copy.disabled = true;
  let source;
  try {
    const response = await fetch(icon.path);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    source = await response.text();
    if (activeIcon !== icon) return;
    await navigator.clipboard.writeText(source);
    if (activeIcon !== icon) return;
    copySource.hidden = true;
    copyStatus.textContent = 'SVG copied.';
  } catch {
    if (activeIcon !== icon) return;
    if (source) {
      copySource.hidden = false;
      copyText.value = source;
      copyText.select();
      copyStatus.textContent = 'Copy the selected SVG source.';
    } else {
      copyStatus.textContent = 'Open the SVG to access its source.';
    }
  } finally {
    if (activeIcon === icon) copy.disabled = false;
  }
}

function makeCard(icon) {
  const item = template.content.firstElementChild.cloneNode(true);
  const button = item.querySelector('button');
  const paths = iconExtensions(icon);
  const extra = paths.length - 2;
  item.querySelector('img').src = icon.path;
  item.querySelector('.format-name').textContent = icon.name;
  const extensions = item.querySelector('.format-extensions');
  extensions.textContent = paths.slice(0, 2).join(', ') + (extra > 0 ? ` +${extra}` : '');
  extensions.classList.toggle('is-description', paths.length === 1 && !icon.extensions.length && !filenameMap.has(paths[0]));
  button.title = `${icon.name} (${paths.join(', ')})`;
  button.addEventListener('click', () => openDetails(icon, button));
  return item;
}

function makeGroup(category, items) {
  const section = element('section', 'format-group');
  const heading = element('h3', 'group-title');
  if (category.color) heading.append(swatch(category.color));
  heading.append(category.name);
  section.append(heading);
  if (category.description) section.append(element('p', 'group-description', category.description));
  const grid = element('ul', 'format-grid');
  for (const icon of items) grid.append(makeCard(icon));
  section.append(grid);
  return section;
}

function emptyState() {
  const state = element('div', 'empty-state');
  const clear = element('button', 'button', 'Clear filters');
  clear.type = 'button';
  clear.addEventListener('click', () => {
    search.value = '';
    setCategory('');
    search.focus();
  });
  state.append(element('h3', '', 'No matching formats'), element('p', '', 'Try a different filename or category.'), clear);
  return state;
}

function render() {
  const query = search.value.trim();
  const matching = matchesFor(query);
  resultCount.textContent = query || selectedCategory
    ? `${matching.length} of ${icons.length} icons`
    : `${icons.length} icons`;
  if (!matching.length) {
    results.replaceChildren(emptyState());
  } else if (query) {
    results.replaceChildren(makeGroup({ name: 'Search results' }, matching));
  } else if (selectedCategory) {
    results.replaceChildren(makeGroup(categoryById.get(selectedCategory), matching));
  } else {
    results.replaceChildren(...categories.map(category => makeGroup(category, matching.filter(icon => icon.category === category.id))));
  }
}

function setCategory(category) {
  selectedCategory = category;
  categorySelect.value = category;
  for (const [id, button] of filterButtons) button.setAttribute('aria-pressed', String(id === selectedCategory));
  render();
}

function addFilters() {
  const choices = [{ id: '', name: 'All categories' }, ...categories];
  const counts = new Map(choices.map(category => [category.id, 0]));
  for (const icon of icons) counts.set(icon.category, counts.get(icon.category) + 1);
  counts.set('', icons.length);
  for (const category of choices) {
    const button = element('button', 'category-button');
    button.type = 'button';
    button.append(swatch(category.color), element('span', '', category.name), element('span', 'category-count', String(counts.get(category.id))));
    button.addEventListener('click', () => setCategory(category.id));
    filters.append(button);
    filterButtons.set(category.id, button);
    const option = element('option', '', category.name);
    option.value = category.id;
    categorySelect.append(option);
  }
}

for (const sample of document.querySelectorAll('.sample')) {
  const id = sample.getAttribute('href').split('/').at(-1).replace(/\.svg$/u, '');
  const icon = iconById.get(id);
  if (icon) sample.addEventListener('click', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    event.preventDefault();
    openDetails(icon, sample);
  });
}

search.addEventListener('input', () => {
  cancelAnimationFrame(renderFrame);
  renderFrame = requestAnimationFrame(render);
});
categorySelect.addEventListener('change', () => setCategory(categorySelect.value));
sizeSelect.addEventListener('change', () => document.documentElement.style.setProperty('--preview-size', `${sizeSelect.value}px`));
backgroundSelect.addEventListener('change', () => { document.documentElement.dataset.previewBackground = backgroundSelect.value; });
copy.addEventListener('click', copySvg);
dialog.addEventListener('close', () => {
  activeIcon = undefined;
  dialogTrigger?.focus();
});

addFilters();
setCategory('');
