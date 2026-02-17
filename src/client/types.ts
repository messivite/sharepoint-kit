export interface SpClientConfig {
  siteId: string;
  getAccessToken: () => Promise<string>;
  baseUrl?: string;
  retryOptions?: RetryOptions;
}

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
}

export interface SpListItem<T extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  fields: T;
  contentType?: {
    id: string;
    name: string;
  };
  createdDateTime?: string;
  lastModifiedDateTime?: string;
  createdBy?: SpIdentity;
  lastModifiedBy?: SpIdentity;
  webUrl?: string;
}

export interface SpIdentity {
  user?: {
    id: string;
    displayName: string;
    email?: string;
  };
}

export interface SpField {
  name: string;
  displayName: string;
  type: SpFieldType;
  required: boolean;
  readOnly: boolean;
  description?: string;
  defaultValue?: string;
  choices?: string[];
  lookupListId?: string;
}

export type SpFieldType =
  | 'Text'
  | 'Note'
  | 'Number'
  | 'Currency'
  | 'DateTime'
  | 'Boolean'
  | 'Choice'
  | 'MultiChoice'
  | 'Lookup'
  | 'User'
  | 'URL'
  | 'Calculated'
  | 'Taxonomy'
  | 'Unknown';

export interface SpList {
  id: string;
  displayName: string;
  name: string;
  description?: string;
  webUrl?: string;
  createdDateTime?: string;
  lastModifiedDateTime?: string;
}

export interface SpSite {
  id: string;
  displayName: string;
  name: string;
  webUrl: string;
  description?: string;
}

export interface SpContentType {
  id: string;
  name: string;
  description?: string;
  group?: string;
  isBuiltIn?: boolean;
}

export interface SpColumn {
  id: string;
  name: string;
  displayName: string;
  type: SpFieldType;
  required: boolean;
  readOnly: boolean;
  description?: string;
  defaultValue?: unknown;
}

export interface GetListItemsOptions {
  listId: string;
  contentTypeName?: string;
  filter?: string;
  select?: string[];
  expand?: string[];
  orderBy?: string;
  top?: number;
  skip?: number;
}

export interface GetItemOptions {
  listId: string;
  itemId: string;
  select?: string[];
  expand?: string[];
}

export interface CreateItemOptions<T extends Record<string, unknown> = Record<string, unknown>> {
  listId: string;
  fields: Partial<T>;
  contentTypeId?: string;
}

export interface UpdateItemOptions<T extends Record<string, unknown> = Record<string, unknown>> {
  listId: string;
  itemId: string;
  fields: Partial<T>;
}

export interface DeleteItemOptions {
  listId: string;
  itemId: string;
}

export interface GraphListResponse<T extends Record<string, unknown> = Record<string, unknown>> {
  value: Array<{
    id: string;
    fields: T & { ContentType?: { Name: string } };
    createdDateTime?: string;
    lastModifiedDateTime?: string;
    createdBy?: SpIdentity;
    lastModifiedBy?: SpIdentity;
    webUrl?: string;
  }>;
  '@odata.nextLink'?: string;
}

export interface GraphErrorResponse {
  error: {
    code: string;
    message: string;
    innerError?: {
      'request-id'?: string;
      date?: string;
      'client-request-id'?: string;
    };
  };
}
