import { useState, useCallback } from 'react';
import type { SpListItem, CreateItemOptions, UpdateItemOptions, DeleteItemOptions } from '../client/types.js';
import { useSpContext } from '../components/sp-provider.js';

interface MutationState<T> {
  data: T | undefined;
  error: Error | undefined;
  isLoading: boolean;
}

export function useSpCreate<T extends Record<string, unknown> = Record<string, unknown>>(
  options: { listId: string },
) {
  const { client } = useSpContext();
  const [state, setState] = useState<MutationState<SpListItem<T>>>({
    data: undefined,
    error: undefined,
    isLoading: false,
  });

  const mutate = useCallback(
    async (createOptions: Omit<CreateItemOptions<T>, 'listId'>) => {
      setState((prev) => ({ ...prev, isLoading: true, error: undefined }));
      try {
        const result = await client.createItem<T>({
          listId: options.listId,
          ...createOptions,
        });
        setState({ data: result, error: undefined, isLoading: false });
        return result;
      } catch (error) {
        setState({ data: undefined, error: error as Error, isLoading: false });
        throw error;
      }
    },
    [client, options.listId],
  );

  return { ...state, mutate };
}

export function useSpUpdate<T extends Record<string, unknown> = Record<string, unknown>>(
  options: { listId: string },
) {
  const { client } = useSpContext();
  const [state, setState] = useState<MutationState<SpListItem<T>>>({
    data: undefined,
    error: undefined,
    isLoading: false,
  });

  const mutate = useCallback(
    async (updateOptions: Omit<UpdateItemOptions<T>, 'listId'>) => {
      setState((prev) => ({ ...prev, isLoading: true, error: undefined }));
      try {
        const result = await client.updateItem<T>({
          listId: options.listId,
          ...updateOptions,
        });
        setState({ data: result, error: undefined, isLoading: false });
        return result;
      } catch (error) {
        setState({ data: undefined, error: error as Error, isLoading: false });
        throw error;
      }
    },
    [client, options.listId],
  );

  return { ...state, mutate };
}

export function useSpDelete(options: { listId: string }) {
  const { client } = useSpContext();
  const [state, setState] = useState<MutationState<void>>({
    data: undefined,
    error: undefined,
    isLoading: false,
  });

  const mutate = useCallback(
    async (deleteOptions: Omit<DeleteItemOptions, 'listId'>) => {
      setState((prev) => ({ ...prev, isLoading: true, error: undefined }));
      try {
        await client.deleteItem({
          listId: options.listId,
          ...deleteOptions,
        });
        setState({ data: undefined, error: undefined, isLoading: false });
      } catch (error) {
        setState({ data: undefined, error: error as Error, isLoading: false });
        throw error;
      }
    },
    [client, options.listId],
  );

  return { ...state, mutate };
}
