import { readFileSync, existsSync } from 'fs';
import { resolve, extname } from 'path';

export type ListSelectionStrategy = 'interactive' | 'first' | 'error' | 'all';

/** Microsoft login (MSAL) config for browser/SPA. Use for "Sign in with Microsoft". */
export interface SpLoginConfig {
  tenantId: string;
  clientId: string;
  redirectUri: string;
  scopes?: string[];
}

export interface ContentTypeConfig {
  listId?: string;
  listName?: string;
  contentTypeName: string;
  outputType: string;
  strategy?: ListSelectionStrategy;
}

export interface SpKitConfig {
  siteId: string;
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
  /** Microsoft login config for browser (SPA). Optional; when set, enables "Sign in with Microsoft". */
  login?: SpLoginConfig;
  defaultStrategy?: ListSelectionStrategy;
  contentTypes: ContentTypeConfig[];
  options?: {
    outputDir?: string;
    outputFile?: string;
    fieldNameMapping?: Record<string, string>;
  };
}

export async function loadConfig(configPath: string): Promise<SpKitConfig> {
  const absolutePath = resolve(process.cwd(), configPath);

  if (!existsSync(absolutePath)) {
    throw new Error(`Config file not found: ${absolutePath}`);
  }

  const ext = extname(absolutePath);
  let config: SpKitConfig;

  if (ext === '.json') {
    const content = readFileSync(absolutePath, 'utf-8');
    config = JSON.parse(content) as SpKitConfig;
  } else if (ext === '.ts' || ext === '.js' || ext === '.mjs') {
    const module = await import(absolutePath);
    config = module.default ?? module;
  } else {
    throw new Error(`Unsupported config file format: ${ext}. Use .json, .ts, .js, or .mjs`);
  }

  validateConfig(config);
  return config;
}

function validateConfig(config: unknown): asserts config is SpKitConfig {
  if (!config || typeof config !== 'object') {
    throw new Error('Config must be an object');
  }

  const c = config as Record<string, unknown>;

  if (!c.siteId || typeof c.siteId !== 'string') {
    throw new Error('Config must have a "siteId" string property');
  }

  if (!Array.isArray(c.contentTypes) || c.contentTypes.length === 0) {
    throw new Error('Config must have a non-empty "contentTypes" array');
  }

  for (const [index, ct] of (c.contentTypes as unknown[]).entries()) {
    if (!ct || typeof ct !== 'object') {
      throw new Error(`contentTypes[${index}] must be an object`);
    }

    const ctObj = ct as Record<string, unknown>;

    if (!ctObj.contentTypeName || typeof ctObj.contentTypeName !== 'string') {
      throw new Error(`contentTypes[${index}] must have a "contentTypeName" string property`);
    }

    if (!ctObj.outputType || typeof ctObj.outputType !== 'string') {
      throw new Error(`contentTypes[${index}] must have an "outputType" string property`);
    }

    if (ctObj.listId !== undefined && typeof ctObj.listId !== 'string') {
      throw new Error(`contentTypes[${index}].listId must be a string`);
    }

    if (ctObj.listName !== undefined && typeof ctObj.listName !== 'string') {
      throw new Error(`contentTypes[${index}].listName must be a string`);
    }

    const validStrategies: ListSelectionStrategy[] = ['interactive', 'first', 'error', 'all'];
    if (ctObj.strategy !== undefined && !validStrategies.includes(ctObj.strategy as ListSelectionStrategy)) {
      throw new Error(`contentTypes[${index}].strategy must be one of: ${validStrategies.join(', ')}`);
    }
  }

  if (c.defaultStrategy !== undefined) {
    const validStrategies: ListSelectionStrategy[] = ['interactive', 'first', 'error', 'all'];
    if (!validStrategies.includes(c.defaultStrategy as ListSelectionStrategy)) {
      throw new Error(`defaultStrategy must be one of: ${validStrategies.join(', ')}`);
    }
  }
}
