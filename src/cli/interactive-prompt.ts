import prompts from 'prompts';
import type { ListSelectionStrategy } from './config-loader.js';

export interface ListInfo {
  id: string;
  displayName: string;
  name: string;
}

export interface ListSelection {
  listId: string;
  listName: string;
}

export async function promptListSelection(
  contentTypeName: string,
  lists: ListInfo[],
  strategy: ListSelectionStrategy = 'interactive',
): Promise<ListSelection[]> {
  if (strategy === 'first') {
    console.log(`  Using first match: "${lists[0].displayName}" (${lists[0].id})`);
    return [{ listId: lists[0].id, listName: lists[0].displayName }];
  }

  if (strategy === 'error') {
    throw new Error(
      `Content type "${contentTypeName}" found in ${lists.length} lists. ` +
      `Please specify listId or listName in config, or use --strategy=all`,
    );
  }

  if (strategy === 'all') {
    console.log(`  Generating types for ALL ${lists.length} lists`);
    return lists.map((list) => ({
      listId: list.id,
      listName: list.displayName,
    }));
  }

  console.log(`\n  Content type "${contentTypeName}" found in ${lists.length} lists:\n`);

  const choices = [
    ...lists.map((list, index) => ({
      title: `${index + 1}. ${list.displayName} (${list.id})`,
      value: list.id,
      description: `List ID: ${list.id}`,
    })),
    {
      title: `Generate types for ALL ${lists.length} lists`,
      value: '__all__',
      description: lists.map((l) => l.displayName).join(', '),
    },
    {
      title: 'Skip this content type',
      value: '__skip__',
      description: 'Do not generate types for this content type',
    },
  ];

  const response = await prompts({
    type: 'select',
    name: 'selection',
    message: `Which list(s) should be used for "${contentTypeName}"?`,
    choices,
    initial: 0,
  });

  if (!response.selection || response.selection === '__skip__') {
    console.log(`  Skipped "${contentTypeName}"\n`);
    return [];
  }

  if (response.selection === '__all__') {
    console.log(`  Generating types for all lists\n`);
    return lists.map((list) => ({
      listId: list.id,
      listName: list.displayName,
    }));
  }

  const selectedList = lists.find((l) => l.id === response.selection);
  if (!selectedList) {
    throw new Error('Invalid selection');
  }

  console.log(`  Selected: ${selectedList.displayName}\n`);
  return [{ listId: response.selection, listName: selectedList.displayName }];
}
