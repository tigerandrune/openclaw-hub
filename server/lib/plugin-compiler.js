import { transformSync } from 'esbuild';
import { readFileSync, statSync } from 'fs';

// In-memory cache: key = "pluginId:mtime" → compiled code
const cache = new Map();

/**
 * Compile a .jsx plugin file to browser-ready ES module.
 * Rewrites @openclaw-hub/api imports to the served API endpoint.
 */
export function compilePlugin(filePath, pluginId) {
  const stat = statSync(filePath);
  const cacheKey = `${pluginId}:${stat.mtimeMs}`;

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const source = readFileSync(filePath, 'utf8');

  const result = transformSync(source, {
    loader: 'jsx',
    format: 'esm',
    jsx: 'automatic',
    jsxImportSource: 'react',
    target: 'es2020',
    minify: false, // keep readable for auditing
  });

  // Rewrite @openclaw-hub/api → served API module
  let code = result.code;
  code = code.replace(
    /from\s+['"]@openclaw-hub\/api['"]/g,
    "from '/api/plugins/_api.js'"
  );

  // Rewrite bare react imports to use the global shim
  // Plugins do `import { useState } from 'react'` — we serve that too
  code = code.replace(
    /from\s+['"]react['"]/g,
    "from '/api/plugins/_react.js'"
  );
  code = code.replace(
    /from\s+['"]react\/jsx-runtime['"]/g,
    "from '/api/plugins/_jsx-runtime.js'"
  );

  cache.set(cacheKey, code);

  // Keep cache bounded — evict old entries
  if (cache.size > 50) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }

  return code;
}
