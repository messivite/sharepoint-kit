import useSWR from 'swr';
import type { SpListItem, GetListItemsOptions } from '../client/types.js';
import { useSpContext } from '../components/sp-provider.js';

export interface UseSpListOptions extends GetListItemsOptions {
  enabled?: boolean;
  refreshInterval?: number;
}

export interface UseSpListReturn<T extends Record<string, unknown>> {
  data: SpListItem<T>[] | undefined;
  isLoading: boolean;
  error: Error | undefined;
  refetch: () => Promise<SpListItem<T>[] | undefined>;
}

export function useSpList<T extends Record<string, unknown> = Record<string, unknown>>(
  options: UseSpListOptions,
): UseSpListReturn<T> {
  const { client } = useSpContext();
  const { enabled = true, refreshInterval, ...listOptions } = options;

  const key = enabled ? ['sp-list', listOptions.listId, listOptions.contentTypeName, listOptions.filter] : null;

  const { data, error, isLoading, mutate } = useSWR(
    key,
    () => client.getListItems<T>(listOptions),
    { refreshInterval },
  );

  return {
    data,
    isLoading,
    error,
    refetch: mutate,
  };
}
