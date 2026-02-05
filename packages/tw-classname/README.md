# tw-classname

Type definitions for the `tw()` function used with the `@repo/vite-plugin` Vite plugin.

## Installation

This package provides TypeScript type definitions only. The actual transformation is handled by the Vite plugin.

```bash
pnpm add -D tw-classname @repo/vite-plugin
```

## Usage

```typescript
import { tw } from 'tw-classname';

// The tw() function is compiled away at build time
const className = tw("text-base font-normal", {
  md: "text-lg px-4",
  lg: "text-xl px-6"
});

// At build time, this becomes:
// "text-base font-normal md:text-lg md:px-4 lg:text-xl lg:px-6"
```

## Features

- **Zero Runtime Cost**: Compiled to static strings at build time
- **Type Safe**: Full TypeScript support with autocomplete
- **Framework Agnostic**: Works with React, Vue, Svelte, and any Vite-compatible framework

## Supported Breakpoints

- `sm` - Small devices (640px)
- `md` - Medium devices (768px)
- `lg` - Large devices (1024px)
- `xl` - Extra large devices (1280px)
- `2xl` - 2X large devices (1536px)

## Requirements

- Vite ^5.0.0 || ^6.0.0 || ^7.0.0
- `@repo/vite-plugin` configured in your `vite.config.ts`

## License

MIT
