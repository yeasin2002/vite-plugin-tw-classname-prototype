# Product Overview

## tw-classname

A Vite plugin that transforms responsive Tailwind CSS utilities into cleaner, breakpoint-grouped syntax at build time with zero runtime overhead.

## Core Value Proposition

Eliminates verbose responsive prefixes (`md:`, `lg:`, `xl:`) by allowing developers to group classes by breakpoint during development, then compiling them to standard Tailwind classes in production.

## Key Principles

- **Zero Runtime Cost**: Everything compiles to static strings at build time - no runtime dependencies
- **Framework Agnostic**: Single plugin works with React, Vue, Svelte, Solid, and any Vite-compatible framework
- **Build-Time Transformation**: Uses Vite's transform hook to convert `tw()` calls during bundling
- **Type Safe**: Full TypeScript support with proper type definitions
- **Performance First**: Fast regex pre-filtering, AST parsing only when needed, hook filters for optimization

## Architecture Philosophy

**Vite-Only Strategy**: Built exclusively as a Vite plugin (not Webpack/Babel/Next.js) because:

- Vite is the modern standard for all major frameworks (React, Vue, Svelte)
- Single codebase covers entire ecosystem
- Leverages Vite's performance and plugin API
- Native ES modules and fast HMR

**Transformation Flow**:

1. User writes `tw()` calls in source code
2. Plugin detects calls via regex/AST during build
3. Transforms to prefixed Tailwind classes
4. Output contains only static strings
5. Zero production bundle impact

## Target Users

Frontend developers using Tailwind CSS with Vite who want cleaner responsive utility syntax without runtime overhead.

## Success Criteria

- Production bundle size: 0 KB (compiled away)
- Transform time: <5ms per file
- HMR updates: <50ms
- Build time impact: <5% increase
- Works identically across all Vite-compatible frameworks
