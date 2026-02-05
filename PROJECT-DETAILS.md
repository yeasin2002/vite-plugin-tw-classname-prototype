# tw-classname - Vite Plugin Project Documentation

## Executive Summary

**Project Name:** tw-classname  
**Type:** Vite Plugin (NPM Package)  
**Category:** Build-Time Developer Experience Tool for Tailwind CSS  
**Architecture:** Vite Plugin with AST Transformation  
**Target Frameworks:** React, Vue, Svelte, and any Vite-compatible framework  
**Technology Stack:** Vite Plugin API, esbuild/Babel for AST transformation

> **⚡ Zero Runtime Overhead:** `tw()` only exists during development and is compiled to static strings at build time. Your production bundle contains no extra code—just the classes you'd write manually.

---

## Problem Statement

Current Tailwind CSS responsive utilities require repetitive prefixes (`md:`, `lg:`, `xl:`) making classnames verbose and harder to read, especially with complex responsive designs.

**Current Approach (verbose):**

```typescript
className =
  "max-w-full text-5xl md:max-w-4/5 md:items-end md:text-center lg:text-6xl lg:font-bold";
```

---

## Proposed Solution

`tw-classname` provides a Vite plugin that transforms cleaner, breakpoint-grouped syntax into standard Tailwind classes **at build time** with zero runtime overhead.

### Development (What You Write)

```typescript
import { tw } from "tw-classname";

tw("font-caudex text-xl font-normal text-black", {
  lg: "max-w-4/5 items-end justify-end text-center whitespace-pre-wrap",
  md: "max-w-full text-5xl whitespace-nowrap",
});
```

### Production (What Gets Compiled)

```typescript
"font-caudex text-xl font-normal text-black lg:max-w-4/5 lg:items-end lg:justify-end lg:text-center lg:whitespace-pre-wrap md:max-w-full md:text-5xl md:whitespace-nowrap";
```

---

## Why Vite-Only Architecture?

### Strategic Advantages

**1. Unified Build Tool Ecosystem**

- Vite is the modern standard for React, Vue, and Svelte development in 2025
- Official framework scaffolding tools (create-vite, create-vue, SvelteKit) all use Vite
- Single plugin covers all major frontend frameworks

**2. Performance & Developer Experience**

- Vite's native ES modules during dev = instant server start
- HMR updates reflect in <50ms
- esbuild-powered pre-bundling is 20-30x faster than traditional bundlers

**3. Simplified Maintenance**

- One plugin codebase instead of separate Babel/Webpack/Next.js/Rollup plugins
- Vite's plugin API is well-documented and stable
- Large, active community and ecosystem

**4. Framework Agnostic by Default**

- Works with React, Vue, Svelte, Solid, Lit, Qwik, Preact out of the box
- No framework-specific code needed
- Automatic JSX/Vue SFC transformation support

### Technical Justification

**Vite Plugin API Benefits:**

- `transform` hook with full AST access
- `configResolved` for plugin configuration
- `configureServer` for dev server integration
- Hook filters for performance optimization (new in Vite 6.3.0+)
- Compatible with Rollup ecosystem

**Build-Time Transformation:**

```javascript
// Vite Plugin Flow
1. User writes tw() in source code
2. Plugin transform hook detects tw() calls via regex/AST
3. Transforms to prefixed Tailwind classes
4. Output contains only static strings
5. Zero runtime dependencies
```

---

## Technical Architecture

### Core Technology Stack

**Primary Dependencies:**

- `vite` (peer dependency, ^7.0.0)
- `@babel/parser` for AST parsing (optional, can use esbuild)
- `@babel/traverse` for AST traversal (optional)
- `magic-string` for efficient string transformations

**Development Tools:**

- TypeScript for type safety
- tsup for plugin bundling
- Vitest for testing
- Changesets for versioning

**Zero Runtime Dependencies:**

- Compiles to static strings during build
- No production bundle impact
- Type definitions only (`tw-classname/types`)

### Plugin Architecture

```
tw-classname/
├── packages/
│   ├── vite-plugin/                # Main Vite plugin
│   │   ├── src/
│   │   │   ├── index.ts           # Plugin entry point
│   │   │   ├── transform.ts       # Core transformation logic
│   │   │   ├── parser.ts          # AST parsing utilities
│   │   │   ├── utils.ts           # Helper functions
│   │   │   └── types.ts           # Internal types
│   │   ├── tests/
│   │   │   ├── transform.test.ts
│   │   │   ├── integration.test.ts
│   │   │   └── fixtures/
│   │   └── package.json
│   │
│   └── types/                      # Type-only package
│       ├── index.d.ts              # tw() function types
│       └── package.json
│
├── examples/                       # Example implementations
│   ├── vite-react/
│   ├── vite-vue/
│   ├── vite-svelte/
│   └── vite-solid/
│
├── docs/                           # Documentation
│   ├── installation.md
│   ├── usage.md
│   ├── configuration.md
│   └── migration.md
│
└── README.md
```

---

## Vite Plugin Implementation Details

### 1. Plugin API Structure

```typescript
// packages/vite-plugin/src/index.ts
import type { Plugin } from "vite";

export interface TwClassnameOptions {
  /** Include patterns (default: /\.[jt]sx?$/) */
  include?: string | RegExp | (string | RegExp)[];

  /** Exclude patterns (default: /node_modules/) */
  exclude?: string | RegExp | (string | RegExp)[];

  /** Custom breakpoints (default: sm, md, lg, xl, 2xl) */
  breakpoints?: string[];

  /** Enable debug logging */
  debug?: boolean;
}

export default function twClassname(options: TwClassnameOptions = {}): Plugin {
  const filter = createFilter(
    options.include || /\.[jt]sx?$/,
    options.exclude || /node_modules/,
  );

  return {
    name: "tw-classname",
    enforce: "pre", // Run before other transformations

    // Transform hook with filter (Vite 6.3.0+)
    transform: {
      filter: {
        id: /\.[jt]sx?$/, // Hook filter for performance
      },
      handler(code: string, id: string) {
        // Skip if no tw() calls detected
        if (!code.includes("tw(")) return null;

        // Apply user filter
        if (!filter(id)) return null;

        // Transform code
        const result = transformTwCalls(code, id, options);

        return {
          code: result.code,
          map: result.map, // Source map support
        };
      },
    },

    configResolved(config) {
      // Store resolved config for use in other hooks
      // Can be used for env-specific behavior
    },
  };
}
```

### 2. Transformation Approaches

**Option A: Regex-Based (Fast, Limited)**

```typescript
// Simple regex transformation for basic cases
function transformTwCalls(code: string): string {
  return code.replace(
    /tw\(\s*['"`]([^'"`]+)['"`]\s*,\s*\{([^}]+)\}\s*\)/g,
    (match, baseClasses, responsiveObj) => {
      const transformed = parseAndTransform(baseClasses, responsiveObj);
      return `"${transformed}"`;
    },
  );
}
```

**Option B: AST-Based with Babel (Robust, Accurate)**

```typescript
// packages/vite-plugin/src/transform.ts
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import generate from "@babel/generator";
import MagicString from "magic-string";

export function transformTwCalls(
  code: string,
  id: string,
  options: TwClassnameOptions,
) {
  const ast = parse(code, {
    sourceType: "module",
    plugins: ["jsx", "typescript"],
  });

  const s = new MagicString(code);
  let hasTransforms = false;

  traverse(ast, {
    CallExpression(path) {
      // Check if it's a tw() call
      if (
        path.node.callee.type === "Identifier" &&
        path.node.callee.name === "tw"
      ) {
        const args = path.node.arguments;

        // Extract base classes and responsive object
        const baseClasses = extractStringLiteral(args[0]);
        const responsiveObj = extractObjectExpression(args[1]);

        if (baseClasses !== null) {
          // Build transformed class string
          const transformed = buildClassString(
            baseClasses,
            responsiveObj,
            options,
          );

          // Replace in source code
          const start = path.node.start;
          const end = path.node.end;
          s.overwrite(start, end, `"${transformed}"`);
          hasTransforms = true;
        }
      }
    },
  });

  if (!hasTransforms) return null;

  return {
    code: s.toString(),
    map: s.generateMap({ hires: true }),
  };
}

function buildClassString(
  baseClasses: string,
  responsiveObj: Record<string, string>,
  options: TwClassnameOptions,
): string {
  const parts: string[] = [baseClasses.trim()];

  // Add responsive classes with breakpoint prefixes
  for (const [breakpoint, classes] of Object.entries(responsiveObj)) {
    const prefixed = classes
      .trim()
      .split(/\s+/)
      .map((cls) => `${breakpoint}:${cls}`)
      .join(" ");
    parts.push(prefixed);
  }

  return parts.join(" ");
}
```

**Option C: Hybrid Approach (Recommended)**

```typescript
// Use regex for quick detection, AST for transformation
export function transformTwCalls(
  code: string,
  id: string,
  options: TwClassnameOptions,
) {
  // Fast path: check if code contains tw() calls
  if (!code.includes("tw(")) return null;

  // Use AST only when necessary
  return transformWithAST(code, id, options);
}
```

### 3. Hook Filters for Performance (Vite 6.3+)

```typescript
// Leverage Rolldown/Rollup hook filters for better performance
transform: {
  filter: {
    id: /\.[jt]sx?$/, // Only JS/TS/JSX/TSX files
    // code: /tw\(/, // Optional: filter by code content
  },
  handler(code, id) {
    // Transform logic
  },
}
```

### 4. Development Server Integration

```typescript
configureServer(server) {
  // Add middleware for dev-time debugging
  server.middlewares.use((req, res, next) => {
    if (req.url === '/__tw-classname-debug') {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        transformCount: stats.transformCount,
        filesProcessed: stats.filesProcessed,
      }));
      return;
    }
    next();
  });
}
```

---

## API Design

### Primary Function: `tw()`

**TypeScript Signature:**

```typescript
type ResponsiveBreakpoint = "sm" | "md" | "lg" | "xl" | "2xl";
type ResponsiveClasses = Partial<Record<ResponsiveBreakpoint, string>>;

function tw(baseClasses: string, responsiveClasses?: ResponsiveClasses): string;
```

**Usage Examples:**

```typescript
// Basic responsive
tw("text-base", { md: "text-lg", lg: "text-xl" });
// Compiles to: "text-base md:text-lg lg:text-xl"

// Multiple classes per breakpoint
tw("flex items-center", {
  md: "justify-between gap-4",
  lg: "gap-6 p-8",
});
// Compiles to: "flex items-center md:justify-between md:gap-4 lg:gap-6 lg:p-8"

// Only base classes
tw("bg-blue-500 text-white");
// Compiles to: "bg-blue-500 text-white"

// Complex layout
tw("container mx-auto px-4", {
  sm: "px-6",
  md: "px-8 max-w-4xl",
  lg: "px-12 max-w-6xl",
  xl: "px-16 max-w-7xl",
});
```

### Framework-Specific Examples

**React:**

```tsx
import { tw } from "tw-classname";

function Button({ size }: { size: "sm" | "lg" }) {
  return (
    <button
      className={tw("px-4 py-2 rounded", {
        md: size === "lg" ? "px-6 py-3" : "px-4 py-2",
      })}
    >
      Click me
    </button>
  );
}
```

**Vue:**

```vue
<script setup lang="ts">
import { tw } from "tw-classname";

const buttonClass = tw("btn-primary", {
  md: "text-lg",
  lg: "text-xl px-8",
});
</script>

<template>
  <button :class="buttonClass">Click me</button>
</template>
```

**Svelte:**

```svelte
<script lang="ts">
  import { tw } from 'tw-classname';

  const cardClass = tw('card shadow', {
    md: 'shadow-lg p-6',
    lg: 'shadow-xl p-8'
  });
</script>

<div class={cardClass}>
  Content
</div>
```

---

## Installation & Configuration

### Installation

```bash
# npm
npm install -D tw-classname

# yarn
yarn add -D tw-classname

# pnpm
pnpm add -D tw-classname

# bun
bun add -D tw-classname
```

### Vite Configuration

**Basic Setup:**

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; // or vue, svelte, etc.
import twClassname from "tw-classname";

export default defineConfig({
  plugins: [
    react(),
    twClassname(), // Add the plugin
  ],
});
```

**Advanced Configuration:**

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import twClassname from "tw-classname";

export default defineConfig({
  plugins: [
    react(),
    twClassname({
      // Include only specific files
      include: /\.(tsx|jsx)$/,

      // Exclude test files
      exclude: [/\.test\.(tsx|jsx)$/, /\.spec\.(tsx|jsx)$/],

      // Add custom breakpoints
      breakpoints: ["sm", "md", "lg", "xl", "2xl", "3xl"],

      // Enable debug logging
      debug: process.env.NODE_ENV === "development",
    }),
  ],
});
```

### Framework-Specific Setups

**React with TypeScript:**

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc"; // Using SWC for speed
import twClassname from "tw-classname";

export default defineConfig({
  plugins: [react(), twClassname()],
});
```

**Vue 3:**

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import twClassname from "tw-classname";

export default defineConfig({
  plugins: [
    vue(),
    twClassname({
      include: /\.(vue|ts|tsx)$/,
    }),
  ],
});
```

**Svelte:**

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import twClassname from "tw-classname";

export default defineConfig({
  plugins: [
    svelte(),
    twClassname({
      include: /\.(svelte|ts)$/,
    }),
  ],
});
```

**SvelteKit:**

```typescript
// vite.config.ts
import { sveltekit } from "@sveltejs/kit/vite";
import twClassname from "tw-classname";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit(), twClassname()],
});
```

---

## Development Workflow

### Phase 1: Core Plugin (Weeks 1-3)

**Week 1: Plugin Foundation**

- [ ] Set up monorepo structure with pnpm workspaces
- [ ] Create basic Vite plugin skeleton
- [ ] Implement regex-based transformation (MVP)
- [ ] Add TypeScript definitions package
- [ ] Set up Vitest for testing

**Week 2: AST Transformation**

- [ ] Implement Babel-based AST parsing
- [ ] Add support for all breakpoint variations
- [ ] Handle edge cases (template literals, variables)
- [ ] Implement source map generation
- [ ] Add hook filters for performance

**Week 3: Testing & Optimization**

- [ ] Write comprehensive unit tests
- [ ] Add integration tests with Vite
- [ ] Performance benchmarking
- [ ] Add debug mode and error handling
- [ ] Documentation for core API

### Phase 2: Framework Integration (Week 4)

**Deliverables:**

- [ ] React example project
- [ ] Vue 3 example project
- [ ] Svelte example project
- [ ] Integration tests for each framework
- [ ] Framework-specific documentation

### Phase 3: Developer Experience (Week 5)

**Deliverables:**

- [ ] VSCode extension for autocomplete (optional)
- [ ] ESLint plugin for validation (optional)
- [ ] CLI tool for testing transformations
- [ ] Migration guide from manual approach
- [ ] Troubleshooting documentation

### Phase 4: Release Preparation (Week 6)

**Deliverables:**

- [ ] Final testing across all frameworks
- [ ] Performance optimization
- [ ] Complete documentation
- [ ] Example projects published
- [ ] Beta release on npm

---

## Testing Strategy

### Unit Tests

```typescript
// packages/vite-plugin/tests/transform.test.ts
import { describe, it, expect } from "vitest";
import { transformTwCalls } from "../src/transform";

describe("transformTwCalls", () => {
  it("transforms basic responsive classes", () => {
    const input = `tw("text-base", { md: "text-lg" })`;
    const expected = `"text-base md:text-lg"`;

    const result = transformTwCalls(input, "test.tsx", {});
    expect(result?.code).toBe(expected);
  });

  it("handles multiple breakpoints", () => {
    const input = `tw("flex", { md: "gap-4", lg: "gap-6" })`;
    const expected = `"flex md:gap-4 lg:gap-6"`;

    const result = transformTwCalls(input, "test.tsx", {});
    expect(result?.code).toBe(expected);
  });

  it("preserves code without tw() calls", () => {
    const input = `const x = "hello"`;
    const result = transformTwCalls(input, "test.tsx", {});
    expect(result).toBeNull();
  });
});
```

### Integration Tests

```typescript
// packages/vite-plugin/tests/integration.test.ts
import { describe, it, expect } from "vitest";
import { build } from "vite";
import twClassname from "../src/index";

describe("Vite integration", () => {
  it("works in production build", async () => {
    const result = await build({
      plugins: [twClassname()],
      build: {
        write: false,
        rollupOptions: {
          input: "fixtures/basic.tsx",
        },
      },
    });

    // Assert output contains transformed classes
    const output = result.output[0].code;
    expect(output).toContain("md:text-lg");
    expect(output).not.toContain("tw(");
  });
});
```

---

## Performance Considerations

### Optimization Strategies

**1. Hook Filters (Vite 6.3+)**

```typescript
transform: {
  filter: {
    id: /\.[jt]sx?$/, // Reduces hook calls
  },
  handler(code, id) {
    // Only called for matching files
  },
}
```

**2. Early Return Pattern**

```typescript
transform(code, id) {
  // Fast check before expensive operations
  if (!code.includes('tw(')) return null;

  // Only parse AST when necessary
  return transformWithAST(code, id);
}
```

**3. Caching**

```typescript
const transformCache = new Map<string, TransformResult>();

transform(code, id) {
  const cacheKey = `${id}:${code}`;
  if (transformCache.has(cacheKey)) {
    return transformCache.get(cacheKey);
  }

  const result = transformTwCalls(code, id);
  transformCache.set(cacheKey, result);
  return result;
}
```

**4. Regex Pre-filtering**

```typescript
const TW_CALL_REGEX = /tw\s*\(/;

transform(code, id) {
  // Ultra-fast regex check
  if (!TW_CALL_REGEX.test(code)) return null;

  // Expensive AST parsing only when needed
  return transformWithAST(code, id);
}
```

### Benchmarks

Target performance metrics:

- **Cold start:** <100ms additional time
- **Transform time:** <5ms per file
- **HMR update:** <50ms
- **Build time impact:** <5% increase

---

## Advanced Features (Future Roadmap)

### v2.0: State Variants Support

```typescript
tw("base-class", {
  hover: "hover-class",
  focus: "focus-class",
  dark: "dark-class",
  md: "responsive-class",
});

// Compiles to:
("base-class hover:hover-class focus:focus-class dark:dark-class md:responsive-class");
```

### v3.0: Container Queries

```typescript
tw("base", {
  "@sm": "container-sm-class", // Container query
  "@md": "container-md-class",
});
```

### v4.0: Arbitrary Values

```typescript
tw("base", {
  md: "[width:500px] [height:300px]",
});
```

---

## Migration from Other Tools

### From Manual Prefixing

**Before:**

```typescript
className = "text-base md:text-lg lg:text-xl md:px-4 lg:px-6";
```

**After:**

```typescript
className={tw("text-base", {
  md: "text-lg px-4",
  lg: "text-xl px-6"
})}
```

### From clsx/classnames

**Before:**

```typescript
import clsx from 'clsx';

className={clsx(
  "text-base",
  isMobile && "text-sm",
  !isMobile && "md:text-lg lg:text-xl"
)}
```

**After:**

```typescript
import { tw } from 'tw-classname';

className={tw(
  isMobile ? "text-sm" : "text-base",
  { md: "text-lg", lg: "text-xl" }
)}
```

---

## Ecosystem Integration

### Tailwind CSS Configuration

Works with all Tailwind configurations:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
  },
};
```

### Prettier Integration

Compatible with prettier-plugin-tailwindcss:

```javascript
// .prettierrc
{
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

The transformed output will be formatted:

```typescript
// Before transform
tw("flex items-center", { md: "gap-4 justify-between" });

// After transform + Prettier
("flex items-center md:gap-4 md:justify-between");
```

### ESLint Integration (Future)

```javascript
// .eslintrc.js
module.exports = {
  plugins: ["tw-classname"],
  rules: {
    "tw-classname/no-invalid-breakpoints": "error",
    "tw-classname/prefer-object-syntax": "warn",
  },
};
```

---

## Build Output Analysis

### Bundle Size Impact

**Development:**

```json
{
  "tw-classname": "0 KB (type imports only)"
}
```

**Production:**

```json
{
  "tw-classname": "0 KB (compiled away)",
  "before-compression": "Same as manual strings",
  "after-compression": "Same as manual strings"
}
```

### Source Maps

Full source map support for debugging:

```typescript
// Original source
tw("base", { md: "responsive" });

// Compiled output
("base md:responsive");

// Source map points to original tw() call
```

---

## Error Handling & Debugging

### Development Warnings

```typescript
// Invalid breakpoint
tw("base", { xxl: "invalid" });
// Warning: Unknown breakpoint 'xxl'. Valid: sm, md, lg, xl, 2xl

// Empty classes
tw("base", { md: "" });
// Warning: Empty class string for breakpoint 'md'
```

### Debug Mode

```typescript
// vite.config.ts
twClassname({
  debug: true, // Logs all transformations
});

// Console output:
// [tw-classname] Transformed src/App.tsx:23
//   From: tw("base", { md: "responsive" })
//   To: "base md:responsive"
```

### Build-Time Errors

```typescript
// Invalid syntax
tw("base" { md: "responsive" }) // Missing comma
// Error: Syntax error in tw() call at src/App.tsx:15

// Non-string arguments
tw(variable, { md: "responsive" })
// Error: tw() expects string literal as first argument at src/App.tsx:20
```

---

## Comparison with Alternatives

| Feature                | tw-classname | Manual  | clsx        | tailwind-merge | CVA      |
| ---------------------- | ------------ | ------- | ----------- | -------------- | -------- |
| **Responsive Helper**  | ✅           | ❌      | ❌          | ❌             | ❌       |
| **Zero Runtime**       | ✅           | ✅      | ❌          | ❌             | ❌       |
| **Bundle Size (prod)** | 0 KB         | 0 KB    | 0.5 KB      | 7 KB           | 5 KB     |
| **Transform Time**     | 5ms          | 0ms     | 0ms         | 0ms            | 0ms      |
| **Type Safety**        | ✅           | ❌      | ✅          | ✅             | ✅       |
| **Vite Native**        | ✅           | N/A     | ❌          | ❌             | ❌       |
| **Framework Support**  | All          | All     | All         | All            | All      |
| **Source Maps**        | ✅           | ✅      | ✅          | ✅             | ✅       |
| **HMR Speed**          | Fast         | Fast    | Fast        | Fast           | Fast     |
| **Use Case**           | Responsive   | General | Conditional | Merging        | Variants |

---

## Success Metrics

### Year 1 Goals

**Adoption:**

- 50,000+ NPM downloads
- 1,000+ GitHub stars
- 20+ community contributors
- Featured in Awesome Vite

**Community:**

- 10+ blog posts/tutorials
- 5+ framework integrations
- Active Discord/GitHub discussions

**Quality:**

- 95%+ test coverage
- <10 open issues
- <24hr issue response time
- Quarterly releases

---

## Documentation Structure

```
docs/
├── getting-started/
│   ├── installation.md
│   ├── quick-start.md
│   └── migration.md
├── guides/
│   ├── react.md
│   ├── vue.md
│   ├── svelte.md
│   └── solid.md
├── api/
│   ├── plugin-options.md
│   ├── tw-function.md
│   └── typescript.md
├── examples/
│   ├── basic-usage.md
│   ├── advanced-patterns.md
│   └── real-world.md
└── troubleshooting/
    ├── common-issues.md
    ├── debugging.md
    └── faq.md
```

---

## Release Strategy

### Versioning

**Semantic Versioning:**

- **Major (v1.0.0, v2.0.0):** Breaking API changes
- **Minor (v1.1.0, v1.2.0):** New features, backward compatible
- **Patch (v1.0.1, v1.0.2):** Bug fixes

### Release Schedule

- **Beta (Weeks 1-6):** `0.1.0-beta.1`
- **RC (Week 7):** `1.0.0-rc.1`
- **v1.0.0 (Week 8):** Official release
- **Minor releases:** Every 2-3 months
- **Patch releases:** As needed

---

## Community & Support

### Communication Channels

- **GitHub Issues:** Bug reports, feature requests
- **GitHub Discussions:** Q&A, ideas, show & tell
- **Discord:** Real-time community support
- **Twitter/X:** Updates and announcements

### Contributing

```markdown
# Contributing to tw-classname

## Getting Started

1. Fork the repository
2. Install dependencies: `pnpm install`
3. Run tests: `pnpm test`
4. Make your changes
5. Submit a PR

## Development

- `pnpm dev` - Start development mode
- `pnpm build` - Build all packages
- `pnpm test` - Run tests
- `pnpm lint` - Run linter
```

---

## Conclusion

`tw-classname` as a Vite plugin offers:

**✅ Modern Architecture**

- Single plugin for all frameworks
- Leverages Vite's performance
- Native ES modules support
- esbuild/Babel flexibility

**✅ Zero Production Cost**

- No runtime overhead
- No bundle size impact
- Identical to manual strings
- Full source map support

**✅ Exceptional DX**

- Cleaner responsive syntax
- Full TypeScript support
- Framework agnostic
- Hot Module Replacement

**✅ Future-Proof**

- Built on Vite's stable API
- Active Vite ecosystem
- Regular updates
- Community-driven

---

## Next Steps

**Week 1-3:** Core plugin development
**Week 4:** Framework integrations
**Week 5:** Documentation & examples
**Week 6:** Beta testing
**Week 7:** Polish & RC
**Week 8:** v1.0.0 Release

---

**Document Version:** 2.0.0  
**Last Updated:** February 6, 2026  
**Architecture:** Vite Plugin Only  
**Status:** Ready for Implementation
