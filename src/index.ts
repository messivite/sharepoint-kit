export { createSpClient } from './client/sp-client.js';
export type {
  SpClientConfig,
  SpListItem,
  SpField,
  SpList,
  SpSite,
  SpContentType,
  SpColumn,
  GetListItemsOptions,
  GetItemOptions,
  CreateItemOptions,
  UpdateItemOptions,
  DeleteItemOptions,
} from './client/types.js';
export {
  SpError,
  SpAuthError,
  SpNotFoundError,
  SpThrottleError,
  SpValidationError,
} from './client/errors.js';
