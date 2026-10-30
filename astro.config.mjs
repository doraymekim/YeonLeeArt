import { defineConfig } from "astro/config";
import Tailwind from "@astrojs/tailwind";
import icon from "astro-icon";
import { fileURLToPath } from "node:url";
import { assertEmittedPages, removeRepoOnlyOriginals } from "./scripts/assert-emitted-pages.mjs";

// The Rollup 4.40.1 deadlock exits 0 *before* `astro:build:done`, because the
// event loop drains during "generating static routes". Setting a failing
// exit code up front means that early exit is a failure; a finished build
// clears it only after the HTML pages are actually on disk.
function failEmptyBuild() {
  return {
    name: "fail-empty-build",
    hooks: {
      "astro:build:start": () => {
        process.exitCode = 1;
      },
      "astro:build:done": ({ dir, pages, logger }) => {
        const distDir = fileURLToPath(dir);
        // public/ originals are copied into dist with everything else. Drop
        // them before the build is treated as finished so they are not deployed.
        removeRepoOnlyOriginals(distDir);
        const ok = pages.length > 0 && assertEmittedPages(distDir);
        if (!ok) {
          logger.error(
            "Build finished without the homepage and /about/. Failing so an empty site cannot deploy.",
          );
          throw new Error("Build emitted zero pages.");
        }
        process.exitCode = 0;
      },
    },
  };
}

// https://astro.build/config
export default defineConfig({
  integrations: [Tailwind(), icon(), failEmptyBuild()],
});
