import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
      'hooks/index': 'src/hooks/index.ts',
      'components/index': 'src/components/index.ts',
      'cli/index': 'src/cli/index.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    splitting: true,
    clean: true,
    treeshake: true,
    sourcemap: true,
    external: [
      'react',
      'react-dom',
      'swr',
      '@radix-ui/themes',
      '@radix-ui/react-icons',
    ],
  },
  {
    entry: {
      'bin/sp-generate-types': 'bin/sp-generate-types.ts',
    },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
]);
