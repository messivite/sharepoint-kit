import { writeFileSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { loadConfig, type SpKitConfig, type ListSelectionStrategy } from './config-loader.js';
import { CacheManager } from './cache-manager.js';
import { resolveContentType, type ResolvedContentType } from './list-resolver.js';
import { generateTypeScript } from './type-generator.js';
import { createSpClient } from '../client/sp-client.js';

export interface GenerateTypesOptions {
  configPath: string;
  nonInteractive?: boolean;
  strategy?: ListSelectionStrategy;
  clearCache?: boolean;
  updateCache?: boolean;
}

export async function generateTypes(options: GenerateTypesOptions): Promise<void> {
  const { configPath, nonInteractive = false, strategy, clearCache = false } = options;

  console.log('\nSharePoint Kit - Type Generator\n');

  const config = await loadConfig(configPath);
  const outputDir = config.options?.outputDir ?? './generated';
  const outputFile = config.options?.outputFile ?? 'sp-types.ts';
  const cacheManager = new CacheManager(outputDir);

  if (clearCache) {
    cacheManager.clear();
    console.log('Cache cleared.\n');
    return;
  }

  const globalStrategy = strategy ?? config.defaultStrategy ?? 'interactive';

  console.log(`Site: ${config.siteId}`);
  console.log(`Strategy: ${globalStrategy}`);
  console.log(`Output: ${outputDir}/${outputFile}\n`);

  const getAccessToken = await createTokenProvider(config);

  const client = createSpClient({
    siteId: config.siteId,
    getAccessToken,
  });

  console.log('Scanning SharePoint site...\n');

  const allResolved: ResolvedContentType[] = [];

  for (const ctConfig of config.contentTypes) {
    console.log(`Processing: "${ctConfig.contentTypeName}" -> ${ctConfig.outputType}`);

    try {
      const resolved = await resolveContentType(
        ctConfig,
        config.siteId,
        client,
        cacheManager,
        globalStrategy,
        nonInteractive,
      );
      allResolved.push(...resolved);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`  Error: ${message}`);

      if (nonInteractive) {
        throw error;
      }
    }
  }

  if (allResolved.length === 0) {
    console.log('\nNo content types resolved. Nothing to generate.\n');
    return;
  }

  console.log(`\nGenerating TypeScript interfaces...\n`);

  const tsContent = await generateTypeScript(
    allResolved,
    client,
    { fieldNameMapping: config.options?.fieldNameMapping },
  );

  const outputPath = resolve(process.cwd(), outputDir, outputFile);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, tsContent, 'utf-8');

  console.log(`\nDone! Generated ${allResolved.length} interface(s).`);
  console.log(`Output: ${outputPath}\n`);
}

async function createTokenProvider(config: SpKitConfig): Promise<() => Promise<string>> {
  if (!config.tenantId || !config.clientId) {
    throw new Error(
      'tenantId and clientId are required in config for authentication. ' +
      'You can set them via environment variables: SHAREPOINT_TENANT_ID, SHAREPOINT_CLIENT_ID',
    );
  }

  const clientSecret = config.clientSecret ?? process.env.SHAREPOINT_CLIENT_SECRET;

  if (!clientSecret) {
    throw new Error(
      'clientSecret is required for authentication. ' +
      'Set it in config or via SHAREPOINT_CLIENT_SECRET environment variable',
    );
  }

  const msalConfig = {
    auth: {
      clientId: config.clientId,
      authority: `https://login.microsoftonline.com/${config.tenantId}`,
      clientSecret,
    },
  };

  const cca = new ConfidentialClientApplication(msalConfig);

  return async () => {
    const result = await cca.acquireTokenByClientCredential({
      scopes: ['https://graph.microsoft.com/.default'],
    });

    if (!result?.accessToken) {
      throw new Error('Failed to acquire access token');
    }

    return result.accessToken;
  };
}
