import React from 'react';
import { Card, Flex, Text, Separator } from '@radix-ui/themes';

export interface SpItemCardField {
  key: string;
  label: string;
  format?: 'text' | 'number' | 'currency' | 'date' | 'boolean';
  render?: (value: unknown) => React.ReactNode;
}

export interface SpItemCardProps<T extends Record<string, unknown>> {
  item: T;
  fields: SpItemCardField[];
  title?: string;
  onClick?: () => void;
}

function formatCardValue(value: unknown, format?: string): string {
  if (value === null || value === undefined) return '-';
  switch (format) {
    case 'currency':
      return typeof value === 'number' ? value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }) : String(value);
    case 'number':
      return typeof value === 'number' ? value.toLocaleString('tr-TR') : String(value);
    case 'date':
      return typeof value === 'string' ? new Date(value).toLocaleDateString('tr-TR') : String(value);
    case 'boolean':
      return value ? 'Evet' : 'Hayir';
    default:
      return String(value);
  }
}

export function SpItemCard<T extends Record<string, unknown> = Record<string, unknown>>({
  item,
  fields,
  title,
  onClick,
}: SpItemCardProps<T>) {
  return (
    <Card
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      <Flex direction="column" gap="2">
        {title && (
          <>
            <Text size="4" weight="bold">
              {title}
            </Text>
            <Separator size="4" />
          </>
        )}

        {fields.map((field) => (
          <Flex key={field.key} justify="between" align="center">
            <Text size="2" color="gray">
              {field.label}
            </Text>
            <Text size="2" weight="medium">
              {field.render
                ? field.render(item[field.key])
                : formatCardValue(item[field.key], field.format)}
            </Text>
          </Flex>
        ))}
      </Flex>
    </Card>
  );
}
