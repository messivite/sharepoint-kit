import React from 'react';
import { Table, Spinner, Text, Callout } from '@radix-ui/themes';
import { useSpList } from '../hooks/use-sp-list.js';

export interface SpListTableColumn<T> {
  key: keyof T & string;
  label: string;
  format?: 'text' | 'number' | 'currency' | 'date' | 'boolean';
  render?: (value: unknown, item: T) => React.ReactNode;
}

export interface SpListTableProps<T extends Record<string, unknown>> {
  listId: string;
  contentTypeName?: string;
  columns: SpListTableColumn<T>[];
  filter?: string;
  orderBy?: string;
  top?: number;
  onRowClick?: (item: T, id: string) => void;
  emptyMessage?: string;
}

function formatValue(value: unknown, format?: string): string {
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

export function SpListTable<T extends Record<string, unknown> = Record<string, unknown>>({
  listId,
  contentTypeName,
  columns,
  filter,
  orderBy,
  top,
  onRowClick,
  emptyMessage = 'Kayit bulunamadi',
}: SpListTableProps<T>) {
  const { data, isLoading, error } = useSpList<T>({
    listId,
    contentTypeName,
    filter,
    orderBy,
    top,
  });

  if (isLoading) {
    return <Spinner size="3" />;
  }

  if (error) {
    return (
      <Callout.Root color="red">
        <Callout.Text>{error.message}</Callout.Text>
      </Callout.Root>
    );
  }

  if (!data || data.length === 0) {
    return <Text color="gray">{emptyMessage}</Text>;
  }

  return (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          {columns.map((col) => (
            <Table.ColumnHeaderCell key={col.key}>{col.label}</Table.ColumnHeaderCell>
          ))}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {data.map((item) => (
          <Table.Row
            key={item.id}
            onClick={onRowClick ? () => onRowClick(item.fields, item.id) : undefined}
            style={onRowClick ? { cursor: 'pointer' } : undefined}
          >
            {columns.map((col) => (
              <Table.Cell key={col.key}>
                {col.render
                  ? col.render(item.fields[col.key], item.fields)
                  : formatValue(item.fields[col.key], col.format)}
              </Table.Cell>
            ))}
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}
