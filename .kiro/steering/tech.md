# Technology Stack

## Build System

**Turborepo Monorepo**

- Workspace-based monorepo using pnpm workspaces
- Turbo for task orchestration and caching
- Shared configurations across packages

## Core Technologies

**Runtime**

- Node.js >= 18
- TypeScript 5.9.2 (strict mode)
- React 19.2.0 (for example apps)
- Next.js 16.1.5 (for docs app)

**Build Tools**

- Vite 7.x (peer dependency for plugin)
- Turborepo 2.8.3
- pnpm 9.0.0 (package manager - required)

**Code Quality**

- ESLint 9.x with flat config
- Prettier 3.7.4
- TypeScript strict mode enabled

## Common Commands

### Development

```bash
pnpm dev                      # Start all apps
turbo dev --filter=docs       # Start specific app
pnpm check-types              # Type checking
```

### Building

```bash
pnpm build                    # Build all packages
turbo build --filter=@repo/ui # Build specific package
```

### Code Quality

```bash
pnpm lint                     # Lint all packages
pnpm format                   # Format code with Prettier
```

### Package Management

```bash
pnpm install                  # Install dependencies
pnpm add <pkg> --filter=docs  # Add to specific package
pnpm add -D -w <pkg>          # Add dev dep to root
```

## Plugin Architecture

**Core Dependencies**:

- `vite` (peer dependency ^7.0.0)
- `@babel/parser` and `@babel/traverse` for AST parsing
- `magic-string` for efficient string transformations
- `@rollup/pluginutils` for file filtering

**Development Tools**:

- `tsup` for plugin bundling
- `vitest` for testing
- `changesets` for versioning

**Key Implementation Details**:

- Use Vite's `transform` hook with hook filters (Vite 6.3+)
- Regex pre-filtering before expensive AST parsing
- `enforce: "pre"` to run before other transformations
- Source map generation for debugging
- Caching for repeated transformations

## Testing Strategy

**Unit Tests** (Vitest):

- Test transformation logic with various input patterns
- Edge cases: template literals, nested calls, invalid syntax
- Breakpoint validation and custom configurations

**Integration Tests**:

- Test with actual Vite builds
- Verify production output contains no `tw()` calls
- Test across React, Vue, Svelte frameworks
- HMR behavior validation

**Performance Tests**:

- Benchmark transform time per file
- Measure build time impact
- Test with large codebases

## Code Style Conventions

- Use TypeScript strict mode
- Prefer functional programming patterns
- Early returns for performance (check `code.includes('tw(')` first)
- Comprehensive JSDoc comments for public APIs
- Export types separately from implementation
