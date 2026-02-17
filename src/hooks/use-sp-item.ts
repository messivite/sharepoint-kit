import useSWR from 'swr';
import type { SpListItem, GetItemOptions } from '../client/types.js';
import { useSpContext } from '../components/sp-provider.js';

export interface UseSpItemOptions extends GetItemOptions {
  enabled?: boolean;
}

export interface UseSpItemReturn<T extends Record<string, unknown>> {
  data: SpListItem<T> | undefined;
  isLoading: boolean;
  error: Error | undefined;
  refetch: () => Promise<SpListItem<T> | undefined>;
}

export function useSpItem<T extends Record<string, unknown> = Record<string, unknown>>(
  options: UseSpItemOptions,
): UseSpItemReturn<T> {
  const { client } = useSpContext();
  const { enabled = true, ...itemOptions } = options;

  const key = enabled ? ['sp-item', itemOptions.listId, itemOptions.itemId] : null;

  const { data, error, isLoading, mutate } = useSWR(
    key,
    () => client.getItem<T>(itemOptions),
  );

  return {
    data,
    isLoading,
    error,
    refetch: mutate,
  };
}
