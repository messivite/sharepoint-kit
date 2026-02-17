import type { ContentTypeConfig, ListSelectionStrategy } from './config-loader.js';
import type { CacheManager } from './cache-manager.js';
import { promptListSelection, type ListInfo } from './interactive-prompt.js';

export interface ResolvedContentType {
  contentTypeName: string;
  outputType: string;
  listId: string;
  listName: string;
}

interface GraphClient {
  getLists(): Promise<Array<{ id: string; displayName: string; name: string }>>;
  getList(options: { listId: string }): Promise<{ id: string; displayName: string; name: string }>;
  getListContentTypes(options: { listId: string }): Promise<Array<{ id: string; name: string }>>;
}

export async function resolveContentType(
  config: ContentTypeConfig,
  siteId: string,
  graphClient: GraphClient,
  cacheManager: CacheManager,
  globalStrategy: ListSelectionStrategy,
  nonInteractive: boolean,
): Promise<ResolvedContentType[]> {
  const strategy = config.strategy ?? globalStrategy;

  if (config.listId) {
    const list = await graphClient.getList({ listId: config.listId });
    console.log(`  Found list "${list.displayName}" (${list.id})`);
    return [{
      contentTypeName: config.contentTypeName,
      outputType: config.outputType,
      listId: config.listId,
      listName: list.displayName,
    }];
  }

  const cached = cacheManager.getResolution(config.contentTypeName);
  if (cached) {
    console.log(`  Using cached resolution for "${config.contentTypeName}": ${cached.listName}`);
    return [{
      contentTypeName: config.contentTypeName,
      outputType: config.outputType,
      listId: cached.listId,
      listName: cached.listName,
    }];
  }

  const lists = await graphClient.getLists();

  if (config.listName) {
    const list = lists.find(
      (l) => l.displayName === config.listName || l.name === config.listName,
    );

    if (!list) {
      throw new Error(`List "${config.listName}" not found in site "${siteId}"`);
    }

    console.log(`  Found list "${list.displayName}" (${list.id})`);
    cacheManager.saveResolution(siteId, config.contentTypeName, list.id, list.displayName);

    return [{
      contentTypeName: config.contentTypeName,
      outputType: config.outputType,
      listId: list.id,
      listName: list.displayName,
    }];
  }

  console.log(`  Scanning lists for content type "${config.contentTypeName}"...`);
  const matchingLists: ListInfo[] = [];

  for (const list of lists) {
    try {
      const contentTypes = await graphClient.getListContentTypes({ listId: list.id });
      if (contentTypes.some((ct) => ct.name === config.contentTypeName)) {
        matchingLists.push({
          id: list.id,
          displayName: list.displayName,
          name: list.name,
        });
      }
    } catch {
      // Skip lists with access errors
    }
  }

  if (matchingLists.length === 0) {
    throw new Error(
      `Content type "${config.contentTypeName}" not found in any list of site "${siteId}"`,
    );
  }

  if (matchingLists.length === 1) {
    const list = matchingLists[0];
    console.log(`  Found content type "${config.contentTypeName}" in list "${list.displayName}"`);
    cacheManager.saveResolution(siteId, config.contentTypeName, list.id, list.displayName);

    return [{
      contentTypeName: config.contentTypeName,
      outputType: config.outputType,
      listId: list.id,
      listName: list.displayName,
    }];
  }

  const effectiveStrategy = nonInteractive && strategy === 'interactive' ? 'first' : strategy;

  const selectedLists = await promptListSelection(
    config.contentTypeName,
    matchingLists,
    effectiveStrategy,
  );

  if (selectedLists.length === 0) {
    return [];
  }

  if (selectedLists.length === 1) {
    cacheManager.saveResolution(
      siteId,
      config.contentTypeName,
      selectedLists[0].listId,
      selectedLists[0].listName,
    );
  }

  if (selectedLists.length > 1) {
    return selectedLists.map((list) => ({
      contentTypeName: config.contentTypeName,
      outputType: `${config.outputType}_${list.listName.replace(/\s+/g, '')}`,
      listId: list.listId,
      listName: list.listName,
    }));
  }

  return selectedLists.map((list) => ({
    contentTypeName: config.contentTypeName,
    outputType: config.outputType,
    listId: list.listId,
    listName: list.listName,
  }));
}
