import type {
  SpClientConfig,
  SpListItem,
  SpList,
  SpSite,
  SpContentType,
  SpColumn,
  GetListItemsOptions,
  GetItemOptions,
  CreateItemOptions,
  UpdateItemOptions,
  DeleteItemOptions,
  GraphListResponse,
  GraphErrorResponse,
  RetryOptions,
} from './types.js';
import { parseGraphError, SpThrottleError } from './errors.js';
import { buildGraphUrl, buildFilterQuery, sleep, calculateBackoff } from './utils.js';

const DEFAULT_RETRY: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
};

interface SpClient {
  getListItems<T extends Record<string, unknown> = Record<string, unknown>>(
    options: GetListItemsOptions,
  ): Promise<SpListItem<T>[]>;

  getItem<T extends Record<string, unknown> = Record<string, unknown>>(
    options: GetItemOptions,
  ): Promise<SpListItem<T>>;

  createItem<T extends Record<string, unknown> = Record<string, unknown>>(
    options: CreateItemOptions<T>,
  ): Promise<SpListItem<T>>;

  updateItem<T extends Record<string, unknown> = Record<string, unknown>>(
    options: UpdateItemOptions<T>,
  ): Promise<SpListItem<T>>;

  deleteItem(options: DeleteItemOptions): Promise<void>;

  getSites(options?: { search?: string }): Promise<SpSite[]>;
  getLists(): Promise<SpList[]>;
  getList(options: { listId: string }): Promise<SpList>;
  getContentTypes(options?: { listId?: string }): Promise<SpContentType[]>;
  getListContentTypes(options: { listId: string }): Promise<SpContentType[]>;
  getColumns(options: { contentTypeId: string }): Promise<SpColumn[]>;
  getListColumns(options: { listId: string }): Promise<SpColumn[]>;
}

export function createSpClient(config: SpClientConfig): SpClient {
  const { siteId, getAccessToken } = config;
  const retryOpts = { ...DEFAULT_RETRY, ...config.retryOptions };

  async function request<R>(url: string, options: RequestInit = {}): Promise<R> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retryOpts.maxRetries; attempt++) {
      const token = await getAccessToken();

      const response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (response.ok) {
        if (response.status === 204) {
          return undefined as R;
        }
        return (await response.json()) as R;
      }

      const body = (await response.json().catch(() => ({
        error: { code: 'UnknownError', message: response.statusText },
      }))) as GraphErrorResponse;

      const error = parseGraphError(
        response.status,
        body,
        response.headers.get('Retry-After'),
      );

      if (error instanceof SpThrottleError && attempt < retryOpts.maxRetries) {
        const waitTime = error.retryAfter
          ? error.retryAfter * 1000
          : calculateBackoff(attempt, retryOpts.baseDelay, retryOpts.maxDelay);
        await sleep(waitTime);
        lastError = error;
        continue;
      }

      throw error;
    }

    throw lastError ?? new Error('Max retries exceeded');
  }

  return {
    async getListItems<T extends Record<string, unknown>>(
      options: GetListItemsOptions,
    ): Promise<SpListItem<T>[]> {
      const { listId, contentTypeName, filter, select, expand, orderBy, top, skip } = options;
      const params = new URLSearchParams();

      const filterQuery = buildFilterQuery(contentTypeName, filter);
      if (filterQuery) params.set('$filter', filterQuery);
      if (select?.length) params.set('$select', select.join(','));
      if (expand?.length) params.set('$expand', expand.join(','));
      if (orderBy) params.set('$orderby', orderBy);
      if (top) params.set('$top', String(top));
      if (skip) params.set('$skip', String(skip));

      const queryString = params.toString();
      const url = buildGraphUrl(siteId, 'lists', listId, 'items') +
        (queryString ? `?expand=fields&${queryString}` : '?expand=fields');

      const response = await request<GraphListResponse<T>>(url);

      return response.value.map((item) => ({
        id: item.id,
        fields: item.fields,
        contentType: item.fields.ContentType
          ? { id: '', name: item.fields.ContentType.Name }
          : undefined,
        createdDateTime: item.createdDateTime,
        lastModifiedDateTime: item.lastModifiedDateTime,
        createdBy: item.createdBy,
        lastModifiedBy: item.lastModifiedBy,
        webUrl: item.webUrl,
      }));
    },

    async getItem<T extends Record<string, unknown>>(
      options: GetItemOptions,
    ): Promise<SpListItem<T>> {
      const { listId, itemId, select, expand } = options;
      const params = new URLSearchParams();

      if (select?.length) params.set('$select', select.join(','));
      if (expand?.length) params.set('$expand', expand.join(','));

      const queryString = params.toString();
      const url = buildGraphUrl(siteId, 'lists', listId, 'items', itemId) +
        (queryString ? `?expand=fields&${queryString}` : '?expand=fields');

      const item = await request<{
        id: string;
        fields: T;
        createdDateTime?: string;
        lastModifiedDateTime?: string;
      }>(url);

      return {
        id: item.id,
        fields: item.fields,
        createdDateTime: item.createdDateTime,
        lastModifiedDateTime: item.lastModifiedDateTime,
      };
    },

    async createItem<T extends Record<string, unknown>>(
      options: CreateItemOptions<T>,
    ): Promise<SpListItem<T>> {
      const { listId, fields, contentTypeId } = options;
      const url = buildGraphUrl(siteId, 'lists', listId, 'items');

      const body: Record<string, unknown> = { fields };
      if (contentTypeId) {
        (body.fields as Record<string, unknown>)['ContentType@odata.type'] = contentTypeId;
      }

      const item = await request<{ id: string; fields: T }>(url, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      return { id: item.id, fields: item.fields };
    },

    async updateItem<T extends Record<string, unknown>>(
      options: UpdateItemOptions<T>,
    ): Promise<SpListItem<T>> {
      const { listId, itemId, fields } = options;
      const url = buildGraphUrl(siteId, 'lists', listId, 'items', itemId, 'fields');

      const updatedFields = await request<T>(url, {
        method: 'PATCH',
        body: JSON.stringify(fields),
      });

      return { id: itemId, fields: updatedFields };
    },

    async deleteItem(options: DeleteItemOptions): Promise<void> {
      const { listId, itemId } = options;
      const url = buildGraphUrl(siteId, 'lists', listId, 'items', itemId);

      await request<void>(url, { method: 'DELETE' });
    },

    async getSites(options?: { search?: string }): Promise<SpSite[]> {
      const params = new URLSearchParams();
      if (options?.search) params.set('search', options.search);

      const queryString = params.toString();
      const url = `https://graph.microsoft.com/v1.0/sites${queryString ? `?${queryString}` : ''}`;

      const response = await request<{ value: SpSite[] }>(url);
      return response.value;
    },

    async getLists(): Promise<SpList[]> {
      const url = buildGraphUrl(siteId, 'lists');
      const response = await request<{ value: SpList[] }>(url);
      return response.value;
    },

    async getList(options: { listId: string }): Promise<SpList> {
      const url = buildGraphUrl(siteId, 'lists', options.listId);
      return request<SpList>(url);
    },

    async getContentTypes(options?: { listId?: string }): Promise<SpContentType[]> {
      const url = options?.listId
        ? buildGraphUrl(siteId, 'lists', options.listId, 'contentTypes')
        : buildGraphUrl(siteId, 'contentTypes');

      const response = await request<{ value: SpContentType[] }>(url);
      return response.value;
    },

    async getListContentTypes(options: { listId: string }): Promise<SpContentType[]> {
      const url = buildGraphUrl(siteId, 'lists', options.listId, 'contentTypes');
      const response = await request<{ value: SpContentType[] }>(url);
      return response.value;
    },

    async getColumns(options: { contentTypeId: string }): Promise<SpColumn[]> {
      const url = buildGraphUrl(siteId, 'contentTypes', options.contentTypeId, 'columns');
      const response = await request<{ value: SpColumn[] }>(url);
      return response.value;
    },

    async getListColumns(options: { listId: string }): Promise<SpColumn[]> {
      const url = buildGraphUrl(siteId, 'lists', options.listId, 'columns');
      const response = await request<{ value: SpColumn[] }>(url);
      return response.value;
    },
  };
}
