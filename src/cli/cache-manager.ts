import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

export interface CacheResolution {
  listId: string;
  listName: string;
  resolvedAt: string;
}

export interface CacheData {
  siteId: string;
  lastUpdated: string;
  lists: Array<{
    id: string;
    displayName: string;
    name: string;
    contentTypes: string[];
  }>;
  resolutions: Record<string, CacheResolution>;
}

const CACHE_FILE = '.sharepoint-cache.json';

export class CacheManager {
  private cachePath: string;

  constructor(outputDir: string = './') {
    this.cachePath = join(outputDir, CACHE_FILE);
  }

  load(): CacheData | null {
    if (!existsSync(this.cachePath)) {
      return null;
    }

    try {
      const content = readFileSync(this.cachePath, 'utf-8');
      const data = JSON.parse(content);
      if (!data || typeof data !== 'object') return null;
      return data as CacheData;
    } catch {
      return null;
    }
  }

  save(data: CacheData): void {
    const dir = dirname(this.cachePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(this.cachePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  getResolution(contentTypeName: string): CacheResolution | null {
    const cache = this.load();
    if (!cache) return null;
    return cache.resolutions[contentTypeName] ?? null;
  }

  saveResolution(
    siteId: string,
    contentTypeName: string,
    listId: string,
    listName: string,
  ): void {
    const cache = this.load() ?? {
      siteId,
      lastUpdated: new Date().toISOString(),
      lists: [],
      resolutions: {},
    };

    cache.lastUpdated = new Date().toISOString();
    cache.siteId = siteId;
    cache.resolutions[contentTypeName] = {
      listId,
      listName,
      resolvedAt: new Date().toISOString(),
    };

    this.save(cache);
  }

  saveLists(
    siteId: string,
    lists: Array<{ id: string; displayName: string; name: string; contentTypes: string[] }>,
  ): void {
    const cache = this.load() ?? {
      siteId,
      lastUpdated: new Date().toISOString(),
      lists: [],
      resolutions: {},
    };

    cache.siteId = siteId;
    cache.lastUpdated = new Date().toISOString();
    cache.lists = lists;

    this.save(cache);
  }

  clear(): void {
    if (existsSync(this.cachePath)) {
      writeFileSync(this.cachePath, '{}', 'utf-8');
      console.log('Cache cleared.');
    }
  }

  getCachePath(): string {
    return this.cachePath;
  }
}
