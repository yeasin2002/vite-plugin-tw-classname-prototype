# Project Structure

## Monorepo Organization

Turborepo monorepo using pnpm workspaces:

```
.
├── apps/                    # Application packages
│   └── docs/               # Next.js documentation site (example app)
│
├── tooling/               # Shared packages
│   ├── eslint-config/     # Shared ESLint configurations
│   ├── typescript-config/ # Shared TypeScript configurations
├── package/               # Shared packages
│   ├── [related packages]     
│
├── .kiro/steering/        # AI assistant guidance documents
├── turbo.json             # Turborepo task configuration
├── pnpm-workspace.yaml    # Workspace definition
└── package.json           # Root package.json
```

## Key Conventions

### Workspace Dependencies

Internal packages use `workspace:*` protocol:
```json
{
  "dependencies": {
    "@repo/ui": "workspace:*"
  }
}
```

### Package Naming

- Scoped packages: `@repo/<package-name>` (e.g., `@repo/ui`)
- Apps: Unscoped names (e.g., `docs`)
- All packages are private (not published to npm)

### TypeScript Configuration

- All packages extend shared configs from `@repo/typescript-config`
- Apps use framework-specific configs (e.g., `nextjs.json`)
- Strict mode enabled everywhere

### Component Exports

UI package uses direct file exports pattern:
```json
{
  "exports": {
    "./*": "./src/*.tsx"
  }
}
```

Import as: `import { Button } from "@repo/ui/button"`

### Scripts Organization

Standard script names across all packages:
- `dev` - Development mode (persistent Turbo task)
- `build` - Production build (depends on upstream `^build`)
- `lint` - ESLint with `--max-warnings 0`
- `check-types` - TypeScript type checking without emit

### Turbo Task Dependencies

Use `^` prefix for upstream dependencies:
```json
{
  "build": {
    "dependsOn": ["^build"]  // Build dependencies first
  }
}
```

## Plugin Package Structure

When implementing the Vite plugin packages:

```
packages/
├── vite-plugin/           # Main Vite plugin package
│   ├── src/
│   │   ├── index.ts      # Plugin entry point (exports default function)
│   │   ├── transform.ts  # Core transformation logic
│   │   ├── parser.ts     # AST parsing utilities
│   │   ├── utils.ts      # Helper functions
│   │   └── types.ts      # Internal types
│   ├── tests/
│   │   ├── transform.test.ts
│   │   ├── integration.test.ts
│   │   └── fixtures/     # Test fixtures
│   └── package.json      # Plugin dependencies
│
└── tw-classname/         # Type-only package (for end users)
    ├── index.d.ts        # tw() function type definitions
    └── package.json      # Type-only package config
```

## File Organization Rules

**Plugin Package (`vite-plugin`)**:
- Main export: Default function returning Vite Plugin
- Keep transformation logic separate from plugin setup
- Use `magic-string` for code modifications
- Generate source maps for debugging

**Types Package (`tw-classname`)**:
- Export only TypeScript definitions
- No runtime code
- Defines `tw()` function signature and breakpoint types

**Test Organization**:
- Unit tests alongside source files or in `tests/` folder
- Integration tests in separate `tests/integration/` folder
- Fixtures in `tests/fixtures/` for complex test cases

## Import Patterns

**Within Plugin**:
```typescript
import type { Plugin } from 'vite';
import MagicString from 'magic-string';
import { createFilter } from '@rollup/pluginutils';
```

**End User Imports**:
```typescript
// Type-only import (compiled away)
import { tw } from 'tw-classname';

// Plugin import in vite.config.ts
import twClassname from '@repo/vite-plugin';
```

## Documentation Structure

When creating docs, organize as:
```
docs/
├── getting-started/       # Installation, quick start
├── guides/               # Framework-specific guides
├── api/                  # API reference
├── examples/             # Usage examples
└── troubleshooting/      # Common issues, FAQ
```
