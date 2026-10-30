// Fails the build when Astro exits 0 without writing the site.
// Rollup 4.40.1 chunked the top-level-await image manifest into a circular
// import with the sharp service; prerender then drained the event loop and
// `astro build` exited 0 with dist/ containing no HTML. Cloudflare deployed
// that empty output. This check runs after `astro build` so that case fails.
import { existsSync, readdirSync, readFileSync, statSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function findHtmlFiles(dir) {
  const found = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...findHtmlFiles(full));
    else if (entry.name.endsWith('.html')) found.push(full);
  }
  return found;
}

export function assertEmittedPages(distDir = path.resolve('dist')) {
  const files = findHtmlFiles(distDir);
  const required = ['index.html', path.join('about', 'index.html')];
  const missing = required.filter(
    (rel) => !files.some((file) => file.endsWith(path.join(path.sep, rel)) || file.endsWith(rel)),
  );

  if (files.length === 0 || missing.length > 0) {
    console.error(
      `Refusing to succeed: build emitted ${files.length} HTML file(s) in ${distDir}.`,
    );
    console.error('A good build writes the homepage and /about/. This one did not.');
    if (missing.length > 0) console.error(`Missing: ${missing.join(', ')}`);
    return false;
  }

  const listed = files.map((file) => path.relative(distDir, file)).join(', ');
  console.log(`Build emitted ${files.length} HTML page(s): ${listed}`);
  return true;
}

const RASTER = /\.(jpe?g|png)$/i;

// Full-size originals kept in public/ so they are in the git repo. Astro copies
// public/ into dist, which would upload them and fail the master check below.
// Nothing on the site should link to these names; pages use resized WebP.
export const REPO_ONLY_PUBLIC_ORIGINALS = [
  'whistle-sunset.jpg',
  'just-beyond-episode-1.jpg',
];

export function removeRepoOnlyOriginals(distDir = path.resolve('dist')) {
  for (const name of REPO_ONLY_PUBLIC_ORIGINALS) {
    const full = path.join(distDir, name);
    if (existsSync(full)) unlinkSync(full);
  }
}

export function assertRepoOriginalsNotServed(distDir = path.resolve('dist')) {
  const stillThere = REPO_ONLY_PUBLIC_ORIGINALS.filter((name) =>
    existsSync(path.join(distDir, name)),
  );
  if (stillThere.length > 0) {
    console.error(
      `Refusing to succeed: full-size original(s) are still in ${distDir}: ${stillThere.join(', ')}`,
    );
    return false;
  }

  let text = '';
  for (const file of walk(distDir)) {
    if (/\.(html|js|css)$/i.test(file)) text += readFileSync(file, 'utf8');
  }
  const referenced = REPO_ONLY_PUBLIC_ORIGINALS.filter(
    (name) => text.includes(name) || text.includes(encodeURIComponent(name)),
  );
  if (referenced.length > 0) {
    console.error(
      `Refusing to succeed: a page links to a full-size original: ${referenced.join(', ')}`,
    );
    return false;
  }
  return true;
}

function walk(dir) {
  const found = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...walk(full));
    else found.push(full);
  }
  return found;
}

// Print masters must not be uploaded when no page, lightbox, or fullscreen
// view links to them. Astro emits them and then deletes the unreferenced
// ones; this catches a build that kept them anyway.
export function assertNoUnreferencedMasters(distDir = path.resolve('dist')) {
  const files = walk(distDir);
  let text = '';
  for (const file of files) {
    if (/\.(html|js|css)$/i.test(file)) text += readFileSync(file, 'utf8');
  }
  const leaked = files.filter((file) => {
    if (!RASTER.test(file)) return false;
    const name = path.basename(file);
    return !text.includes(name) && !text.includes(encodeURIComponent(name));
  });
  if (leaked.length === 0) return true;
  const bytes = leaked.reduce((sum, file) => {
    try {
      return sum + statSync(file).size;
    } catch {
      return sum;
    }
  }, 0);
  console.error(
    `Refusing to succeed: ${leaked.length} full-size original(s) (${bytes} bytes) are in ${distDir} and no page links to them.`,
  );
  for (const file of leaked.slice(0, 8)) console.error(`  ${path.relative(distDir, file)}`);
  return false;
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  removeRepoOnlyOriginals();
  if (
    !assertEmittedPages() ||
    !assertRepoOriginalsNotServed() ||
    !assertNoUnreferencedMasters()
  ) {
    process.exit(1);
  }
}
