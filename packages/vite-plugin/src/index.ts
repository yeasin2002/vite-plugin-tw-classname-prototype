import { createFilter } from "@rollup/pluginutils";
import type { Plugin, ResolvedConfig } from "vite";
import { transformCode } from "./transform";
import { DEFAULT_BREAKPOINTS, type TwClassnameOptions } from "./types";

/**
 * Vite plugin for transforming tw() calls to static Tailwind classes
 *
 * @example
 * ```typescript
 * // vite.config.ts
 * import { defineConfig } from 'vite';
 * import twClassname from '@repo/vite-plugin';
 *
 * export default defineConfig({
 *   plugins: [twClassname()],
 * });
 * ```
 *
 * @param options - Plugin configuration options
 * @returns Vite plugin
 */
export default function twClassname(options: TwClassnameOptions = {}): Plugin {
  const filter = createFilter(
    options.include || /\.[jt]sx?$/,
    options.exclude || /node_modules/,
  );

  const breakpoints = options.breakpoints || [...DEFAULT_BREAKPOINTS];
  const debug = options.debug || false;

  let config: ResolvedConfig;

  return {
    name: "tw-classname",
    enforce: "pre",

    configResolved(resolvedConfig) {
      config = resolvedConfig;

      if (debug) {
        console.log("[tw-classname] Plugin initialized with options:", {
          breakpoints,
          command: config.command,
          mode: config.mode,
        });
      }
    },

    transform: {
      // Hook filter for performance (Vite 6.3+)
      // Only process files that match the pattern and contain 'tw('
      filter: {
        id: /\.[jt]sx?$/,
        code: /tw\(/,
      },

      handler(code, id) {
        // Apply user-defined filter
        if (!filter(id)) {
          return null;
        }

        if (debug) {
          console.log(`[tw-classname] Processing: ${id}`);
        }

        // Transform the code
        const result = transformCode(code, id, breakpoints, debug, this);

        if (result && debug) {
          console.log(`[tw-classname] Successfully transformed: ${id}`);
        }

        return result;
      },
    },
  };
}

// Export types
export { DEFAULT_BREAKPOINTS } from "./types";
export type { TwClassnameOptions } from "./types";
