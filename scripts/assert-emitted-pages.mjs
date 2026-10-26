// Fails the build when Astro exits 0 without writing the site.
// Rollup 4.40.1 chunked the top-level-await image manifest into a circular
// import with the sharp service; prerender then drained the event loop and
// `astro build` exited 0 with dist/ containing no HTML. Cloudflare deployed
// that empty output. This check runs after `astro build` so that case fails.
import { readdirSync } from 'node:fs';
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

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly && !assertEmittedPages()) {
  process.exit(1);
}
