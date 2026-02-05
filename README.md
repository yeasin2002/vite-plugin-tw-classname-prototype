# tw-classname

A Vite plugin that transforms responsive Tailwind CSS utilities into cleaner, breakpoint-grouped syntax at build time with **zero runtime overhead**.

## Why tw-classname?

Writing responsive Tailwind classes can get verbose and hard to read:

```tsx
// Before: Repetitive prefixes
className="text-base md:text-lg md:px-4 lg:text-xl lg:px-6 xl:text-2xl xl:px-8"
```

With `tw-classname`, group classes by breakpoint for better readability:

```tsx
// After: Clean and organized
className={tw("text-base", {
  md: "text-lg px-4",
  lg: "text-xl px-6",
  xl: "text-2xl px-8"
})}
```

At build time, this compiles back to standard Tailwind classes with **zero runtime cost**.

## Features

- ⚡ **Zero Runtime Overhead** - Compiles to static strings at build time
- 🎯 **Framework Agnostic** - Works with React, Vue, Svelte, Solid, and any Vite-compatible framework
- 🚀 **Performance First** - Fast regex pre-filtering and optimized AST parsing
- 📦 **Type Safe** - Full TypeScript support with proper type definitions
- 🔥 **HMR Support** - Fast Hot Module Replacement during development

## Project Structure

This is a Turborepo monorepo containing:

### Packages

- `@repo/vite-plugin` - Main Vite plugin (coming soon)
- `tw-classname` - Type definitions package (coming soon)
- `@repo/ui` - Shared React component library
- `@repo/eslint-config` - Shared ESLint configurations
- `@repo/typescript-config` - Shared TypeScript configurations

### Apps

- `docs` - Documentation site built with Next.js

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm 9.0.0 (required)

### Installation

```bash
# Install dependencies
pnpm install

# Start development
pnpm dev

# Build all packages
pnpm build
```

### Development Commands

```bash
# Start all apps in dev mode
pnpm dev

# Start specific app
turbo dev --filter=docs

# Run type checking
pnpm check-types

# Lint all packages
pnpm lint

# Format code
pnpm format
```

## How It Works

1. **Development**: Write `tw()` calls with breakpoint-grouped classes
2. **Build Time**: Vite plugin detects and transforms `tw()` calls via AST
3. **Production**: Output contains only static Tailwind class strings
4. **Result**: Zero runtime dependencies, identical bundle size to manual strings

## Tech Stack

- **Build System**: Turborepo with pnpm workspaces
- **Language**: TypeScript 5.9.2 (strict mode)
- **Plugin Target**: Vite 7.x
- **Testing**: Vitest
- **Code Quality**: ESLint 9.x + Prettier 3.7.4

## Development Roadmap

### Phase 1: Core Plugin (Weeks 1-3)
- [ ] Basic Vite plugin skeleton
- [ ] Regex-based transformation (MVP)
- [ ] AST-based transformation with Babel
- [ ] TypeScript definitions package
- [ ] Unit tests with Vitest

### Phase 2: Framework Integration (Week 4)
- [ ] React example project
- [ ] Vue 3 example project
- [ ] Svelte example project
- [ ] Integration tests

### Phase 3: Developer Experience (Week 5)
- [ ] Debug mode and error handling
- [ ] Performance optimization
- [ ] Documentation site
- [ ] Migration guides

### Phase 4: Release (Week 6)
- [ ] Beta testing
- [ ] Final polish
- [ ] npm publication

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

```bash
# Fork and clone the repository
git clone https://github.com/yourusername/tw-classname.git

# Install dependencies
pnpm install

# Create a feature branch
git checkout -b feature/your-feature

# Make your changes and test
pnpm test
pnpm lint

# Submit a PR
```

## Performance Targets

- **Transform Time**: <5ms per file
- **HMR Updates**: <50ms
- **Build Time Impact**: <5% increase
- **Production Bundle**: 0 KB (compiled away)

## License

MIT

## Links

- [Documentation](./PROJECT-DETAILS.md) - Detailed project documentation
- [Turborepo Docs](https://turborepo.dev) - Learn about Turborepo
- [Vite Plugin API](https://vitejs.dev/guide/api-plugin.html) - Vite plugin development
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework

---

**Status**: 🚧 In Development

**Version**: 0.1.0-alpha

**Last Updated**: February 6, 2026
