# Complete Vite Plugin Reference & Best Practices

## Comprehensive Documentation for tw-classname Plugin Development

**Sources:**
- Vite Official Documentation: https://vite.dev/guide/api-plugin
- Rollup Plugin Development: https://rollupjs.org/plugin-development/
- Vite GitHub Repository & Discussions
- Community Best Practices

**Last Updated:** February 6, 2026

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Vite Plugin System Overview](#vite-plugin-system-overview)
3. [Complete Hook Reference](#complete-hook-reference)
4. [Transform Hook Patterns](#transform-hook-patterns)
5. [AST Transformation with Babel](#ast-transformation-with-babel)
6. [Performance Optimization](#performance-optimization)
7. [Source Map Generation](#source-map-generation)
8. [Virtual Modules](#virtual-modules)
9. [Plugin Context Functions](#plugin-context-functions)
10. [Testing Strategies](#testing-strategies)
11. [Error Handling](#error-handling)
12. [Publishing & Distribution](#publishing--distribution)
13. [tw-classname Specific Implementation](#tw-classname-specific-implementation)

---

## Executive Summary

### What Vite Plugins Are

From official documentation:

> "Vite plugins extends Rollup's well-designed plugin interface with a few extra Vite-specific options. As a result, you can write a Vite plugin once and have it work for both dev and build."

### Key Characteristics

1. **Build-time only** - Plugins run during development and build, not in production
2. **Rollup compatible** - Most Rollup plugins work in Vite
3. **Vite enhanced** - Additional hooks for dev server, HMR, and HTML transformation
4. **Framework agnostic** - Works with React, Vue, Svelte, etc.

---

## Vite Plugin System Overview

### Plugin Architecture Diagram

```
User Code (src/)
      ↓
  Vite Config (vite.config.ts)
      ↓
  Plugin Pipeline:
    1. Alias Resolution
    2. User Plugins (enforce: 'pre')
    3. Vite Core Plugins
    4. User Plugins (default)
    5. Vite Build Plugins
    6. User Plugins (enforce: 'post')
      ↓
  Output (dist/)
```

### Build vs Dev Behavior

**Development Mode:**
- Vite dev server creates plugin container
- Invokes Rollup build hooks
- Modules are NOT bundled
- HMR updates are incremental
- Source maps are inline

**Production Mode:**
- Full Rollup bundling
- All output generation hooks are called
- Chunks are created and optimized
- Source maps are external (if enabled)

**Critical Note from Docs:**
> "Note that the moduleParsed hook is not called during dev, because Vite avoids full AST parses for better performance."

---

## Complete Hook Reference

### Universal Hooks (Rollup)

#### 1. options
**Type:** `async, sequential`  
**When:** First hook, called once on server start  
**Purpose:** Modify Rollup options  

```typescript
options(inputOptions: InputOptions): InputOptions | null {
  return {
    ...inputOptions,
    // modifications
  };
}
```

#### 2. buildStart
**Type:** `async, parallel`  
**When:** After options, once per build  
**Purpose:** Access to resolved options  

**Official Recommendation:**
> "This is the recommended hook to use when you need access to the options passed to rollup.rollup()."

```typescript
buildStart(options: InputOptions): void {
  console.log('Build starting with options:', options);
  // Initialize state
}
```

#### 3. resolveId
**Type:** `async, first`  
**When:** For each import statement  
**Purpose:** Custom module resolution  

```typescript
resolveId(
  source: string,
  importer: string | undefined,
  options: {
    importerAttributes?: Record<string, string>;
    attributes: Record<string, string>;
    custom?: Record<string, any>;
    isEntry: boolean;
  }
): ResolveIdResult {
  if (source === 'virtual-module') {
    return '\0virtual-module';
  }
  return null;
}
```

**Important Notes:**
- Return `null` to defer to other plugins
- Return `false` to mark as external
- Prefix virtual modules with `\0`
- `importer` may be absolute path for index.html

#### 4. load
**Type:** `async, first`  
**When:** After resolveId for each module  
**Purpose:** Provide module content  

```typescript
load(id: string): LoadResult {
  if (id === '\0virtual-module') {
    return {
      code: 'export default "virtual content"',
      map: null,
    };
  }
  return null;
}
```

**Return Value Options:**
```typescript
type LoadResult = string | null | {
  code: string;
  map?: SourceMap | null;
  ast?: ESTree.Program;
  meta?: Record<string, any>;
  moduleSideEffects?: boolean | 'no-treeshake';
  syntheticNamedExports?: boolean | string;
};
```

#### 5. transform
**Type:** `async, sequential`  
**When:** After load for each module  
**Purpose:** Transform module code  

```typescript
transform(code: string, id: string): TransformResult {
  if (!id.endsWith('.custom')) return null;
  
  return {
    code: transformCode(code),
    map: generateSourceMap(),
  };
}
```

**Performance Note:**
> "In watch mode or when using the cache explicitly, the result of this hook is cached when rebuilding."

#### 6. moduleParsed
**Type:** `async, parallel`  
**When:** After module is fully parsed  
**Purpose:** Access module info  

**Important:**
> "Not called during dev because Vite avoids full AST parses for better performance."

```typescript
moduleParsed(moduleInfo: ModuleInfo): void {
  console.log('Module parsed:', moduleInfo.id);
  console.log('Imports:', moduleInfo.importedIds);
}
```

#### 7. buildEnd
**Type:** `async, parallel`  
**When:** After all modules processed  
**Purpose:** Cleanup, final operations  

```typescript
buildEnd(error?: Error): void {
  if (error) {
    console.error('Build failed:', error);
  }
  // Cleanup resources
}
```

#### 8. closeBundle
**Type:** `async, parallel`  
**When:** Server shutdown  
**Purpose:** Final cleanup  

```typescript
closeBundle(): void {
  // Close file watchers, database connections, etc.
}
```

### Vite-Specific Hooks

#### 1. config
**Type:** `async, sequential`  
**When:** Before Vite config is resolved  
**Purpose:** Modify Vite configuration  

```typescript
config(
  config: UserConfig,
  env: { mode: string; command: string }
): UserConfig | null {
  if (env.command === 'build') {
    return {
      build: {
        rollupOptions: {
          // custom options
        },
      },
    };
  }
}
```

**Context Available:**
- `this.meta.rollupVersion`
- `this.meta.watchMode`
- `this.error()`, `this.warn()`, `this.info()`, `this.debug()`

#### 2. configResolved
**Type:** `async, parallel`  
**When:** After Vite config is resolved  
**Purpose:** Read final config  

**Official Example:**
```typescript
const examplePlugin = () => {
  let config;

  return {
    name: 'read-config',
    
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    
    transform(code, id) {
      if (config.command === 'serve') {
        // dev mode
      } else {
        // build mode
      }
    },
  };
};
```

**Command Values:**
- `serve` - Development server
- `build` - Production build

#### 3. configureServer
**Type:** `async, sequential`  
**When:** Dev server setup  
**Purpose:** Configure dev server  

**Adding Middleware (Pre):**
```typescript
configureServer(server: ViteDevServer): void {
  server.middlewares.use((req, res, next) => {
    // Runs before Vite's internal middleware
    next();
  });
}
```

**Adding Middleware (Post):**
```typescript
configureServer(server: ViteDevServer): () => void {
  return () => {
    server.middlewares.use((req, res, next) => {
      // Runs after Vite's internal middleware
      next();
    });
  };
}
```

**Storing Server Reference:**
```typescript
const myPlugin = () => {
  let server;
  
  return {
    name: 'my-plugin',
    configureServer(_server) {
      server = _server;
    },
    transform(code, id) {
      if (server) {
        // Access server.ws, server.moduleGraph, etc.
      }
    },
  };
};
```

#### 4. configurePreviewServer
**Type:** `async, sequential`  
**When:** Preview server setup  
**Purpose:** Configure preview server  

Same pattern as `configureServer`.

#### 5. transformIndexHtml
**Type:** `async, sequential`  
**When:** HTML file is loaded  
**Purpose:** Transform HTML  

**Order Options:**
- `undefined` (default) - After HTML transformation
- `'pre'` - Before HTML processing
- `'post'` - After all other transformations

**Basic Example:**
```typescript
transformIndexHtml(html: string): string {
  return html.replace(
    /<title>(.*?)<\/title>/,
    '<title>New Title</title>'
  );
}
```

**Tag Injection:**
```typescript
transformIndexHtml(html: string): {
  html: string;
  tags: HtmlTagDescriptor[];
} {
  return {
    html,
    tags: [
      {
        tag: 'meta',
        attrs: { name: 'description', content: 'My app' },
        injectTo: 'head',
      },
      {
        tag: 'script',
        attrs: { src: '/init.js' },
        injectTo: 'body-prepend',
      },
    ],
  };
}
```

**Tag Descriptor:**
```typescript
interface HtmlTagDescriptor {
  tag: string;
  attrs?: Record<string, string | boolean>;
  children?: string | HtmlTagDescriptor[];
  injectTo?: 'head' | 'body' | 'head-prepend' | 'body-prepend';
}
```

#### 6. handleHotUpdate
**Type:** `async, sequential`  
**When:** File change detected (watch mode)  
**Purpose:** Custom HMR handling  

```typescript
handleHotUpdate({ 
  file, 
  timestamp, 
  modules, 
  read, 
  server 
}: HmrContext): ModuleNode[] | void {
  if (file.endsWith('.custom')) {
    // Custom HMR logic
    server.ws.send({
      type: 'custom',
      event: 'custom-update',
      data: { file },
    });
    
    return []; // Don't trigger default HMR
  }
}
```

**HMR Context:**
```typescript
interface HmrContext {
  file: string;
  timestamp: number;
  modules: ModuleNode[];
  read: () => string | Promise<string>;
  server: ViteDevServer;
}
```

---

## Transform Hook Patterns

### Pattern 1: Regex-Based (Fast, Limited)

**Use When:**
- Simple string replacements
- No code structure awareness needed
- Maximum performance required

```typescript
transform(code: string, id: string): TransformResult {
  if (!id.endsWith('.custom')) return null;
  
  const transformed = code.replace(
    /tw\(\s*['"`]([^'"`]+)['"`]\s*,\s*\{([^}]+)\}\s*\)/g,
    (match, base, responsive) => {
      return `"${base} ${parseResponsive(responsive)}"`;
    }
  );
  
  if (transformed === code) return null;
  
  return {
    code: transformed,
    map: null, // Preserve existing source maps
  };
}
```

**Pros:**
- Extremely fast
- Simple implementation
- No dependencies

**Cons:**
- Cannot handle nested structures
- Error-prone for complex syntax
- No code awareness

### Pattern 2: AST-Based with Babel (Robust, Accurate)

**Use When:**
- Need to understand code structure
- Complex transformations
- Accurate source maps required

```typescript
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';

transform(code: string, id: string): TransformResult {
  if (!id.match(/\.[jt]sx?$/)) return null;
  
  // Parse to AST
  const ast = parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  });
  
  let modified = false;
  
  // Traverse and modify
  traverse(ast, {
    CallExpression(path) {
      if (path.node.callee.name === 'tw') {
        // Modify AST node
        modified = true;
      }
    },
  });
  
  if (!modified) return null;
  
  // Generate code
  const output = generate(ast, {
    sourceMaps: true,
    sourceFileName: id,
  });
  
  return {
    code: output.code,
    map: output.map,
  };
}
```

**Pros:**
- Accurate code understanding
- Handles all JavaScript syntax
- Generates accurate source maps

**Cons:**
- Slower than regex
- Requires Babel dependencies
- More complex implementation

### Pattern 3: Hybrid with magic-string (Recommended)

**Use When:**
- Need AST for analysis
- Want efficient string manipulation
- Require accurate source maps

```typescript
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import MagicString from 'magic-string';

transform(code: string, id: string): TransformResult {
  if (!code.includes('tw(')) return null;
  
  const ast = parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  });
  
  const s = new MagicString(code);
  let hasChanges = false;
  
  traverse(ast, {
    CallExpression(path) {
      if (path.node.callee.name === 'tw') {
        const { start, end } = path.node;
        const replacement = transformTwCall(path.node);
        
        s.overwrite(start, end, replacement);
        hasChanges = true;
      }
    },
  });
  
  if (!hasChanges) return null;
  
  return {
    code: s.toString(),
    map: s.generateMap({ hires: true }),
  };
}
```

**Pros:**
- Best of both worlds
- Efficient source maps
- Clean API

**Cons:**
- Requires two dependencies
- Slightly more complex

---

## AST Transformation with Babel

### Required Configuration

**Critical from GitHub Discussion:**

When using `@babel/parser` in Vite plugins, you MUST set `sourceType: 'module'`:

```typescript
import { parse } from '@babel/parser';

const ast = parse(code, {
  sourceType: 'module', // REQUIRED
  plugins: ['jsx', 'typescript'],
});
```

**Error Without It:**
```
'import' and 'export' may appear only with 'sourceType: "module"'
```

### Parser Plugins

```typescript
const parserPlugins = [
  'jsx',              // React JSX
  'typescript',       // TypeScript
  'decorators-legacy', // Decorators
  'classProperties',  // Class fields
  'dynamicImport',    // import()
];

const ast = parse(code, {
  sourceType: 'module',
  plugins: parserPlugins,
});
```

### Common Traversal Patterns

**Finding Function Calls:**
```typescript
traverse(ast, {
  CallExpression(path) {
    if (
      path.node.callee.type === 'Identifier' &&
      path.node.callee.name === 'tw'
    ) {
      // Found tw() call
      const args = path.node.arguments;
    }
  },
});
```

**Extracting String Literals:**
```typescript
function extractString(node: Node): string | null {
  if (node.type === 'StringLiteral') {
    return node.value;
  }
  if (node.type === 'TemplateLiteral') {
    // Handle template literals
    if (node.expressions.length === 0) {
      return node.quasis[0].value.raw;
    }
  }
  return null;
}
```

**Extracting Object Properties:**
```typescript
function extractObject(node: Node): Record<string, string> {
  const result: Record<string, string> = {};
  
  if (node.type === 'ObjectExpression') {
    for (const prop of node.properties) {
      if (
        prop.type === 'ObjectProperty' &&
        prop.key.type === 'Identifier' &&
        prop.value.type === 'StringLiteral'
      ) {
        result[prop.key.name] = prop.value.value;
      }
    }
  }
  
  return result;
}
```

### Node Position Information

```typescript
traverse(ast, {
  CallExpression(path) {
    const { start, end, loc } = path.node;
    
    console.log('Character range:', start, end);
    console.log('Line/column:', loc.start, loc.end);
  },
});
```

---

## Performance Optimization

### 1. Hook Filters (Vite 6.3+)

**Fastest Method:**

```typescript
export default function myPlugin() {
  return {
    name: 'my-plugin',
    
    transform: {
      filter: {
        id: /\.[jt]sx?$/,
        code: /tw\(/,
      },
      handler(code, id) {
        // Only called when BOTH filters match
        return transformCode(code);
      },
    },
  };
}
```

**Filter Performance:**
- Executed in Rust (Rolldown)
- No JavaScript overhead
- Significantly faster than manual checks

### 2. Early Returns

```typescript
transform(code, id) {
  // Cheapest check first
  if (!code.includes('tw(')) return null;
  
  // More expensive check
  if (!filter(id)) return null;
  
  // Most expensive operation
  return transformWithAST(code);
}
```

### 3. Caching

```typescript
const transformCache = new Map();

transform(code, id) {
  const cacheKey = `${id}:${code}`;
  
  if (transformCache.has(cacheKey)) {
    return transformCache.get(cacheKey);
  }
  
  const result = transformCode(code);
  transformCache.set(cacheKey, result);
  
  return result;
}
```

**Note:** Vite already caches transform results, so this is only needed for intermediate computations.

### 4. Avoid Unnecessary Parsing

```typescript
transform(code, id) {
  // Only parse if transformation is needed
  if (!needsTransform(code)) return null;
  
  // Now parse
  const ast = parse(code, parserOptions);
  // ...
}
```

### 5. Use magic-string for Simple Edits

```typescript
// Instead of:
const ast = parse(code);
// traverse, modify, generate
const output = generate(ast);

// Do this for simple replacements:
const s = new MagicString(code);
s.replace('foo', 'bar');
return { code: s.toString(), map: s.generateMap() };
```

**Benchmark:** ~10-100x faster for simple operations

---

## Source Map Generation

### When to Preserve Source Maps

**Official Guidance:**
> "If the transformation does not move code, you can preserve existing sourcemaps by setting map to null."

```typescript
transform(code, id) {
  // Simple replacement
  const newCode = code.replace(/console\.log/g, 'console.debug');
  
  return {
    code: newCode,
    map: null, // Preserves existing mappings
  };
}
```

### Generating Source Maps with magic-string

```typescript
import MagicString from 'magic-string';

transform(code, id) {
  const s = new MagicString(code);
  
  // Make changes
  s.replace('old', 'new');
  s.prepend('/* header */\n');
  s.append('\n/* footer */');
  
  return {
    code: s.toString(),
    map: s.generateMap({
      hires: true, // More accurate, larger size
      source: id,
      file: id,
      includeContent: true,
    }),
  };
}
```

### Generating Source Maps with Babel

```typescript
import generate from '@babel/generator';

const output = generate(ast, {
  sourceMaps: true,
  sourceFileName: id,
}, code);

return {
  code: output.code,
  map: output.map,
};
```

### Source Map Options

```typescript
interface SourceMapOptions {
  hires?: boolean;         // More accurate but larger
  source?: string;         // Original source filename
  file?: string;          // Generated file name
  includeContent?: boolean; // Include original source
}
```

---

## Virtual Modules

### Convention

**Official:**
> "Virtual modules in Vite (and Rollup) are prefixed with virtual: for the user-facing path by convention."

> "Internally, plugins that use virtual modules should prefix the module ID with \0 while resolving the id."

### Implementation Pattern

```typescript
export default function myPlugin() {
  const virtualModuleId = 'virtual:my-config';
  const resolvedVirtualModuleId = '\0' + virtualModuleId;

  return {
    name: 'my-plugin',
    
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    
    load(id) {
      if (id === resolvedVirtualModuleId) {
        return `
          export default {
            apiUrl: import.meta.env.VITE_API_URL,
            version: '1.0.0',
          };
        `;
      }
    },
  };
}
```

### Usage

```typescript
// In application code
import config from 'virtual:my-config';

console.log(config.apiUrl);
```

### TypeScript Support

```typescript
// virtual-modules.d.ts
declare module 'virtual:my-config' {
  export interface Config {
    apiUrl: string;
    version: string;
  }
  
  const config: Config;
  export default config;
}
```

---

## Plugin Context Functions

### this.resolve

**Most Important Context Function**

```typescript
async resolveId(source, importer) {
  // Resolve using Vite's full resolution pipeline
  const resolved = await this.resolve(source, importer, {
    skipSelf: true, // Skip this plugin's resolveId
  });
  
  if (resolved && !resolved.external) {
    // Modify or proxy the resolution
    return {
      id: resolved.id + '?modified',
    };
  }
  
  return null;
}
```

**Options:**
```typescript
interface ResolveOptions {
  skipSelf?: boolean;
  isEntry?: boolean;
  importerAttributes?: Record<string, string>;
  attributes?: Record<string, string>;
  custom?: Record<string, any>;
}
```

### this.load

**Preload and Inspect Modules**

```typescript
async resolveId(source, importer) {
  const resolution = await this.resolve(source, importer);
  
  if (resolution && !resolution.external) {
    // Load and inspect the module
    const moduleInfo = await this.load({
      id: resolution.id,
      resolveDependencies: true,
    });
    
    if (moduleInfo.code.includes('/* special */')) {
      // Return proxy module
      return `${resolution.id}?proxy`;
    }
  }
  
  return null;
}
```

### this.emitFile

**Emit Assets:**
```typescript
const referenceId = this.emitFile({
  type: 'asset',
  name: 'logo.png',
  source: fs.readFileSync('assets/logo.png'),
});

// Reference in code
return `export default import.meta.ROLLUP_FILE_URL_${referenceId}`;
```

**Emit Chunks:**
```typescript
const chunkId = this.emitFile({
  type: 'chunk',
  id: 'src/dynamic-module.js',
  name: 'dynamic',
});
```

### this.getModuleInfo

```typescript
transform(code, id) {
  const moduleInfo = this.getModuleInfo(id);
  
  console.log({
    isEntry: moduleInfo.isEntry,
    importers: moduleInfo.importers,
    dynamicImporters: moduleInfo.dynamicImporters,
    hasDefaultExport: moduleInfo.hasDefaultExport,
  });
}
```

### this.warn / this.error

```typescript
transform(code, id) {
  if (code.includes('DEPRECATED')) {
    this.warn({
      message: 'Deprecated API usage detected',
      id,
      pos: code.indexOf('DEPRECATED'),
      pluginCode: 'DEPRECATED_API',
    });
  }
  
  if (code.includes('INVALID')) {
    this.error({
      message: 'Invalid syntax',
      id,
      pluginCode: 'INVALID_SYNTAX',
    });
  }
}
```

---

## Testing Strategies

### Unit Testing Plugin Logic

```typescript
// plugin.test.ts
import { describe, it, expect } from 'vitest';
import { transformTwCall } from './plugin';

describe('transformTwCall', () => {
  it('transforms basic responsive classes', () => {
    const input = { base: 'text-base', md: 'text-lg' };
    const output = transformTwCall(input);
    
    expect(output).toBe('text-base md:text-lg');
  });
  
  it('handles multiple breakpoints', () => {
    const input = {
      base: 'flex',
      md: 'gap-4',
      lg: 'gap-6',
    };
    const output = transformTwCall(input);
    
    expect(output).toBe('flex md:gap-4 lg:gap-6');
  });
});
```

### Integration Testing with Vite

```typescript
// integration.test.ts
import { build } from 'vite';
import twClassname from './plugin';

describe('Vite integration', () => {
  it('transforms in production build', async () => {
    const result = await build({
      plugins: [twClassname()],
      logLevel: 'silent',
      build: {
        write: false,
        rollupOptions: {
          input: {
            main: 'fixtures/basic.tsx',
          },
        },
      },
    });

    const output = result.output.find(
      chunk => chunk.type === 'chunk' && chunk.isEntry
    );
    
    expect(output.code).toContain('md:text-lg');
    expect(output.code).not.toContain('tw(');
  });
});
```

### Snapshot Testing

```typescript
import { transformSync } from '@babel/core';

describe('transform snapshots', () => {
  it('matches snapshot', () => {
    const input = `
      const className = tw('base', { md: 'responsive' });
    `;
    
    const result = transformSync(input, {
      plugins: [twClassnamePlugin],
    });
    
    expect(result.code).toMatchSnapshot();
  });
});
```

### Testing with vite-plugin-inspect

```typescript
// dev-server.test.ts
import { createServer } from 'vite';
import twClassname from './plugin';

describe('dev server', () => {
  it('transforms during development', async () => {
    const server = await createServer({
      plugins: [twClassname()],
      server: { port: 3000 },
    });
    
    await server.listen();
    
    const module = await server.moduleGraph.getModuleByUrl(
      '/src/App.tsx'
    );
    
    expect(module.transformResult.code).toContain('md:text-lg');
    
    await server.close();
  });
});
```

---

## Error Handling

### Build-Time Errors

```typescript
transform(code, id) {
  try {
    const ast = parse(code, parserOptions);
    return transformAST(ast);
  } catch (error) {
    this.error({
      message: `Parse error: ${error.message}`,
      id,
      cause: error,
      pluginCode: 'PARSE_ERROR',
    });
  }
}
```

### Warnings for Deprecated Usage

```typescript
transform(code, id) {
  const deprecatedPattern = /oldAPI\(/g;
  
  if (deprecatedPattern.test(code)) {
    this.warn({
      message: 'oldAPI() is deprecated, use newAPI() instead',
      id,
      pluginCode: 'DEPRECATED_API',
      meta: {
        migration: 'https://example.com/migration-guide',
      },
    });
  }
}
```

### Graceful Degradation

```typescript
transform(code, id) {
  // Fast path - regex
  if (!code.includes('tw(')) return null;
  
  try {
    // Slow path - AST
    return transformWithAST(code, id);
  } catch (error) {
    // Fallback - regex
    this.warn({
      message: 'AST parsing failed, using fallback transformation',
      id,
      cause: error,
    });
    return transformWithRegex(code, id);
  }
}
```

---

## Publishing & Distribution

### package.json

```json
{
  "name": "vite-plugin-tw-classname",
  "version": "1.0.0",
  "description": "Vite plugin for transforming tw() calls",
  "keywords": ["vite-plugin", "tailwind", "tailwindcss"],
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    }
  },
  "files": ["dist"],
  "engines": {
    "node": ">=18.0.0"
  },
  "peerDependencies": {
    "vite": "^5.0.0 || ^6.0.0 || ^7.0.0"
  },
  "devDependencies": {
    "vite": "^7.0.0",
    "typescript": "^5.0.0",
    "tsup": "^8.0.0"
  },
  "dependencies": {
    "@babel/parser": "^7.24.0",
    "@babel/traverse": "^7.24.0",
    "@rollup/pluginutils": "^5.1.0",
    "magic-string": "^0.30.0"
  }
}
```

### Build Configuration (tsup)

```typescript
// tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  external: ['vite'],
});
```

### README Structure

```markdown
# vite-plugin-tw-classname

Transform tw() calls to static Tailwind classes at build time.

## Installation

```bash
npm install -D vite-plugin-tw-classname
```

## Usage

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import twClassname from 'vite-plugin-tw-classname';

export default defineConfig({
  plugins: [twClassname()],
});
```

## Options

...

## How It Works

...

## License

MIT
```

### Publishing Checklist

- [ ] Package builds successfully
- [ ] All tests pass
- [ ] Documentation is complete
- [ ] Examples are provided
- [ ] TypeScript types are exported
- [ ] package.json is configured correctly
- [ ] README includes installation and usage
- [ ] CHANGELOG is updated
- [ ] License file is included

---

## tw-classname Specific Implementation

### Complete Plugin Code

```typescript
import type { Plugin } from 'vite';
import { createFilter } from '@rollup/pluginutils';
import MagicString from 'magic-string';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';

export interface TwClassnameOptions {
  include?: string | RegExp | (string | RegExp)[];
  exclude?: string | RegExp | (string | RegExp)[];
  breakpoints?: string[];
  debug?: boolean;
}

const DEFAULT_BREAKPOINTS = ['sm', 'md', 'lg', 'xl', '2xl'];

export default function twClassname(
  options: TwClassnameOptions = {}
): Plugin {
  const filter = createFilter(
    options.include || /\.[jt]sx?$/,
    options.exclude || /node_modules/
  );

  const breakpoints = options.breakpoints || DEFAULT_BREAKPOINTS;
  const debug = options.debug || false;

  let config: any;

  return {
    name: 'tw-classname',
    enforce: 'pre',

    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },

    transform: {
      // Hook filter for performance (Vite 6.3+)
      filter: {
        id: /\.[jt]sx?$/,
        code: /tw\(/,
      },
      
      handler(code, id) {
        // Apply user filter
        if (!filter(id)) return null;

        if (debug) {
          console.log(`[tw-classname] Processing: ${id}`);
        }

        // Parse AST
        let ast;
        try {
          ast = parse(code, {
            sourceType: 'module',
            plugins: ['jsx', 'typescript'],
          });
        } catch (error) {
          this.error({
            message: `Failed to parse ${id}`,
            cause: error,
            pluginCode: 'PARSE_ERROR',
          });
          return null;
        }

        const s = new MagicString(code);
        let hasTransforms = false;

        // Traverse AST
        traverse(ast, {
          CallExpression(path) {
            if (
              path.node.callee.type === 'Identifier' &&
              path.node.callee.name === 'tw'
            ) {
              const args = path.node.arguments;

              // Extract base classes
              const baseClasses = extractStringLiteral(args[0]);
              
              // Extract responsive object
              const responsiveObj = extractObjectExpression(args[1]);

              if (baseClasses !== null) {
                // Build transformed string
                const transformed = buildClassString(
                  baseClasses,
                  responsiveObj,
                  breakpoints
                );

                // Replace in code
                const { start, end } = path.node;
                s.overwrite(start, end, `"${transformed}"`);
                
                hasTransforms = true;

                if (debug) {
                  console.log(`[tw-classname] Transformed:`, {
                    input: code.slice(start, end),
                    output: transformed,
                  });
                }
              }
            }
          },
        });

        if (!hasTransforms) return null;

        return {
          code: s.toString(),
          map: s.generateMap({ hires: true }),
        };
      },
    },
  };
}

function extractStringLiteral(node: any): string | null {
  if (node?.type === 'StringLiteral') {
    return node.value;
  }
  if (node?.type === 'TemplateLiteral') {
    if (node.expressions.length === 0) {
      return node.quasis[0].value.raw;
    }
  }
  return null;
}

function extractObjectExpression(
  node: any
): Record<string, string> {
  const result: Record<string, string> = {};

  if (node?.type === 'ObjectExpression') {
    for (const prop of node.properties) {
      if (
        prop.type === 'ObjectProperty' &&
        prop.key.type === 'Identifier' &&
        prop.value.type === 'StringLiteral'
      ) {
        result[prop.key.name] = prop.value.value;
      }
    }
  }

  return result;
}

function buildClassString(
  baseClasses: string,
  responsiveObj: Record<string, string>,
  breakpoints: string[]
): string {
  const parts: string[] = [baseClasses.trim()];

  // Add responsive classes with breakpoint prefixes
  for (const [breakpoint, classes] of Object.entries(responsiveObj)) {
    if (breakpoints.includes(breakpoint)) {
      const prefixed = classes
        .trim()
        .split(/\s+/)
        .map(cls => `${breakpoint}:${cls}`)
        .join(' ');
      parts.push(prefixed);
    }
  }

  return parts.join(' ');
}
```

### Testing Suite

```typescript
// tests/transform.test.ts
import { describe, it, expect } from 'vitest';
import twClassname from '../src/index';

describe('tw-classname transform', () => {
  const plugin = twClassname();
  const transform = plugin.transform as any;

  it('transforms basic responsive classes', () => {
    const input = `
      const cls = tw("text-base", { md: "text-lg" });
    `;

    const result = transform.handler(input, 'test.tsx');
    
    expect(result.code).toContain('"text-base md:text-lg"');
    expect(result.code).not.toContain('tw(');
  });

  it('handles multiple breakpoints', () => {
    const input = `
      tw("flex", { 
        md: "gap-4 justify-center",
        lg: "gap-6 items-end"
      })
    `;

    const result = transform.handler(input, 'test.tsx');
    
    expect(result.code).toContain('flex md:gap-4 md:justify-center lg:gap-6 lg:items-end');
  });

  it('preserves code without tw() calls', () => {
    const input = `
      const x = "hello";
      const y = 123;
    `;

    const result = transform.handler(input, 'test.tsx');
    
    expect(result).toBeNull();
  });

  it('generates source maps', () => {
    const input = `tw("base", { md: "md-class" })`;
    
    const result = transform.handler(input, 'test.tsx');
    
    expect(result.map).toBeDefined();
    expect(result.map.mappings).toBeTruthy();
  });
});
```

---

## References & Resources

### Official Documentation
- **Vite Plugin API:** https://vite.dev/guide/api-plugin
- **Rollup Plugin Development:** https://rollupjs.org/plugin-development/
- **Vite Configuration:** https://vite.dev/config/

### Tools & Libraries
- **@rollup/pluginutils:** https://github.com/rollup/plugins/tree/master/packages/pluginutils
- **magic-string:** https://github.com/rich-harris/magic-string
- **@babel/parser:** https://babeljs.io/docs/babel-parser
- **@babel/traverse:** https://babeljs.io/docs/babel-traverse
- **vite-plugin-inspect:** https://github.com/antfu/vite-plugin-inspect

### Community Resources
- **Awesome Vite:** https://github.com/vitejs/awesome-vite
- **Vite Rolldown:** https://rolldown.rs/

---

**Document Version:** 1.0.0  
**Last Updated:** February 6, 2026  
**Validated Against:** Vite 7.3.1, Rollup 4.x Official Documentation  
**Purpose:** Complete reference for tw-classname Vite plugin development
