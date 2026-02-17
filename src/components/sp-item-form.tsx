import React, { useState, useCallback } from 'react';
import { Button, TextField, Text, Callout, Flex, Box } from '@radix-ui/themes';
import { useSpCreate, useSpUpdate } from '../hooks/use-sp-mutation.js';
import type { SpListItem } from '../client/types.js';

export interface SpFormField {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'textarea';
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | number;
}

export interface SpItemFormProps<T extends Record<string, unknown>> {
  listId: string;
  fields: SpFormField[];
  mode?: 'create' | 'edit';
  itemId?: string;
  initialValues?: Partial<T>;
  onSuccess?: (item: SpListItem<T>) => void;
  onError?: (error: Error) => void;
  submitLabel?: string;
}

export function SpItemForm<T extends Record<string, unknown> = Record<string, unknown>>({
  listId,
  fields,
  mode = 'create',
  itemId,
  initialValues = {},
  onSuccess,
  onError,
  submitLabel,
}: SpItemFormProps<T>) {
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {};
    for (const field of fields) {
      initial[field.key] = initialValues[field.key as keyof T] ?? field.defaultValue ?? '';
    }
    return initial;
  });
  const [formError, setFormError] = useState<string | null>(null);

  const { mutate: create, isLoading: isCreating } = useSpCreate<T>({ listId });
  const { mutate: update, isLoading: isUpdating } = useSpUpdate<T>({ listId });

  const isLoading = isCreating || isUpdating;

  const handleChange = useCallback((key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setFormError(null);

      try {
        let result: SpListItem<T>;
        if (mode === 'edit' && itemId) {
          result = await update({ itemId, fields: values as Partial<T> });
        } else {
          result = await create({ fields: values as Partial<T> });
        }
        onSuccess?.(result);
      } catch (error) {
        const err = error as Error;
        setFormError(err.message);
        onError?.(err);
      }
    },
    [mode, itemId, values, create, update, onSuccess, onError],
  );

  return (
    <form onSubmit={handleSubmit}>
      <Flex direction="column" gap="3">
        {formError && (
          <Callout.Root color="red">
            <Callout.Text>{formError}</Callout.Text>
          </Callout.Root>
        )}

        {fields.map((field) => (
          <Box key={field.key}>
            <Text as="label" size="2" weight="medium">
              {field.label}
              {field.required && <Text color="red"> *</Text>}
            </Text>
            <TextField.Root
              type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
              value={String(values[field.key] ?? '')}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
            />
          </Box>
        ))}

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Kaydediliyor...' : submitLabel ?? (mode === 'edit' ? 'Guncelle' : 'Olustur')}
        </Button>
      </Flex>
    </form>
  );
}
