import type { SpColumn } from '../client/types.js';
import { generateFileHeader, generateInterface, mapSharePointTypeToTs, sanitizeInterfaceName } from './templates.js';

interface GraphClient {
  getColumns(options: { contentTypeId: string }): Promise<SpColumn[]>;
  getListColumns(options: { listId: string }): Promise<SpColumn[]>;
  getContentTypes(options?: { listId?: string }): Promise<Array<{ id: string; name: string }>>;
  getListContentTypes(options: { listId: string }): Promise<Array<{ id: string; name: string }>>;
}

export interface TypeGenerationInput {
  contentTypeName: string;
  outputType: string;
  listId: string;
  listName: string;
}

export interface TypeGenerationOptions {
  fieldNameMapping?: Record<string, string>;
}

export async function generateTypeScript(
  inputs: TypeGenerationInput[],
  graphClient: GraphClient,
  options: TypeGenerationOptions = {},
): Promise<string> {
  const { fieldNameMapping = {} } = options;
  const interfaces: string[] = [generateFileHeader()];

  for (const input of inputs) {
    console.log(`  Generating interface "${input.outputType}" from list "${input.listName}"...`);

    const contentTypes = await graphClient.getListContentTypes({ listId: input.listId });
    const contentType = contentTypes.find((ct) => ct.name === input.contentTypeName);

    let columns: SpColumn[];

    if (contentType) {
      columns = await graphClient.getColumns({ contentTypeId: contentType.id });
    } else {
      console.log(`    Content type not found by ID, falling back to list columns`);
      columns = await graphClient.getListColumns({ listId: input.listId });
    }

    const writableColumns = columns.filter((col) => !col.readOnly && !isSystemColumn(col.name));

    const fields = writableColumns.map((col) => {
      const mappedName = fieldNameMapping[col.name] ?? col.name;
      const tsType = mapSharePointTypeToTs(col.type);

      return {
        name: mappedName,
        tsType,
        required: col.required,
        description: col.displayName !== col.name ? col.displayName : undefined,
      };
    });

    const interfaceName = sanitizeInterfaceName(input.outputType);
    interfaces.push(generateInterface(interfaceName, fields));
  }

  return interfaces.join('\n\n') + '\n';
}

function isSystemColumn(name: string): boolean {
  const systemColumns = new Set([
    'ContentType',
    'Modified',
    'Created',
    'Author',
    'Editor',
    '_ModerationComments',
    '_ModerationStatus',
    'FileSystemObjectType',
    'ServerRedirectedEmbedUri',
    'ServerRedirectedEmbedUrl',
    'ID',
    'ContentTypeId',
    'Attachments',
    'GUID',
    'OData__UIVersionString',
    'ComplianceAssetId',
  ]);

  return systemColumns.has(name);
}
