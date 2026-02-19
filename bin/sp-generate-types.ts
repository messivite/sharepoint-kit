import 'dotenv/config';
import { Command } from 'commander';
import { generateTypes } from '../src/cli/generate-types.js';
import type { ListSelectionStrategy } from '../src/cli/config-loader.js';

const program = new Command();

program
  .name('sp-generate-types')
  .description('Generate TypeScript interfaces from SharePoint content types')
  .version('0.1.0')
  .requiredOption('-c, --config <path>', 'Path to sharepoint.config.ts or .json file')
  .option('--non-interactive', 'Run in non-interactive mode (for CI/CD)', false)
  .option(
    '-s, --strategy <strategy>',
    'List selection strategy when multiple lists found (interactive|first|error|all)',
  )
  .option('--clear-cache', 'Clear the resolution cache and exit', false)
  .option('--update-cache', 'Force update the cache', false)
  .action(async (opts) => {
    try {
      await generateTypes({
        configPath: opts.config,
        nonInteractive: opts.nonInteractive,
        strategy: opts.strategy as ListSelectionStrategy | undefined,
        clearCache: opts.clearCache,
        updateCache: opts.updateCache,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`\nError: ${message}\n`);
      process.exit(1);
    }
  });

program.parse();
