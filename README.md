# @mustafaaksoy/sharepoint-kit

Full-featured SharePoint Graph API client, React hooks, Radix UI components, and CLI type generator for TypeScript projects. Supports Next.js App Router and Pages Router.

## Features

- **Data Client** - Type-safe CRUD operations via Microsoft Graph API with retry/throttle handling
- **React Hooks** - SWR-based hooks (`useSpList`, `useSpItem`, `useSpCreate`, `useSpUpdate`, `useSpDelete`)
- **Radix UI Components** - Ready-to-use `<SpListTable>`, `<SpItemForm>`, `<SpItemCard>`, `<SpErrorBoundary>`
- **CLI Type Generator** - Auto-generate TypeScript interfaces from your SharePoint content types
- **Config-based** - Each user defines their own SharePoint structure via `sharepoint.config.ts`

## Installation

```bash
npm install @mustafaaksoy/sharepoint-kit
```

### Peer Dependencies

```bash
npm install react react-dom swr @radix-ui/themes @radix-ui/react-icons
```

## Quick Start

### 1. Generate Types from SharePoint

Create a `sharepoint.config.ts`:

```typescript
export default {
  siteId: 'root',
  tenantId: process.env.SHAREPOINT_TENANT_ID,
  clientId: process.env.SHAREPOINT_CLIENT_ID,
  defaultStrategy: 'interactive',
  contentTypes: [
    {
      listName: 'Faturalar',
      contentTypeName: 'Fatura Denemesi',
      outputType: 'Invoice',
    },
    {
      contentTypeName: 'Belge',
      outputType: 'Document',
    },
  ],
  options: {
    outputDir: './generated',
    fieldNameMapping: {
      'Fatura_x0020_Numaras_x0131_': 'faturaNo',
    },
  },
};
```

Run the CLI:

```bash
npx sp-generate-types --config sharepoint.config.ts
```

This generates `./generated/sp-types.ts`:

```typescript
export interface Invoice {
  faturaNo?: string;
  Tutar?: number;
  Title?: string;
}

export interface Document {
  Title?: string;
}
```

### 2. Use the Data Client

```typescript
import { createSpClient } from '@mustafaaksoy/sharepoint-kit';
import type { Invoice } from './generated/sp-types';

const client = createSpClient({
  siteId: 'root',
  getAccessToken: async () => yourTokenFunction(),
});

// CRUD operations with full type safety
const items = await client.getListItems<Invoice>({
  listId: '50fc630f-...',
  contentTypeName: 'Fatura Denemesi',
});

const item = await client.getItem<Invoice>({ listId: '...', itemId: '6' });
const created = await client.createItem<Invoice>({ listId: '...', fields: { Tutar: 500 } });
const updated = await client.updateItem<Invoice>({ listId: '...', itemId: '6', fields: { Tutar: 600 } });
await client.deleteItem({ listId: '...', itemId: '6' });
```

### 3. Use React Hooks

```tsx
import { SpProvider } from '@mustafaaksoy/sharepoint-kit/components';
import { useSpList, useSpItem, useSpCreate } from '@mustafaaksoy/sharepoint-kit/hooks';
import type { Invoice } from './generated/sp-types';

// Wrap your app
function App() {
  return (
    <SpProvider config={{ siteId: 'root', getAccessToken }}>
      <InvoiceList />
    </SpProvider>
  );
}

function InvoiceList() {
  const { data, isLoading, error } = useSpList<Invoice>({
    listId: '50fc630f-...',
    contentTypeName: 'Fatura Denemesi',
  });

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <ul>
      {data?.map((item) => (
        <li key={item.id}>{item.fields.Title} - {item.fields.Tutar}</li>
      ))}
    </ul>
  );
}
```

### 4. Use Radix UI Components

```tsx
import { SpProvider, SpListTable, SpItemForm, SpErrorBoundary } from '@mustafaaksoy/sharepoint-kit/components';
import type { Invoice } from './generated/sp-types';

function App() {
  return (
    <SpProvider config={{ siteId: 'root', getAccessToken }}>
      <SpErrorBoundary onAuthError={() => router.push('/login')}>
        <SpListTable<Invoice>
          listId="50fc630f-..."
          contentTypeName="Fatura Denemesi"
          columns={[
            { key: 'faturaNo', label: 'Fatura No' },
            { key: 'Tutar', label: 'Tutar', format: 'currency' },
          ]}
          onRowClick={(item, id) => router.push(`/invoices/${id}`)}
        />
      </SpErrorBoundary>
    </SpProvider>
  );
}
```

## Authentication

You can use **Microsoft Login** (recommended) or **manual token / bypass**.

### Microsoft Login

In your app `.env` add (use `NEXT_PUBLIC_` so the browser can read them):

```env
NEXT_PUBLIC_SHAREPOINT_TENANT_ID=your-tenant-id
NEXT_PUBLIC_SHAREPOINT_CLIENT_ID=your-client-id
NEXT_PUBLIC_SHAREPOINT_REDIRECT_URI=http://localhost:3000
```

In Azure AD: App Registration → Authentication → add **SPA** with this Redirect URI. API permissions: **Sites.Read.All** (Delegated).

Wrap your app with `SpAuthProvider` + `loginConfig`:

```tsx
import { SpAuthProvider, SpProviderWithAuth, type SpLoginConfig } from '@mustafaaksoy/sharepoint-kit/components';
import { Theme } from '@radix-ui/themes';

const loginConfig: SpLoginConfig = {
  tenantId: process.env.NEXT_PUBLIC_SHAREPOINT_TENANT_ID!,
  clientId: process.env.NEXT_PUBLIC_SHAREPOINT_CLIENT_ID!,
  redirectUri: process.env.NEXT_PUBLIC_SHAREPOINT_REDIRECT_URI!,
};

<Theme>
  <SpAuthProvider loginConfig={loginConfig}>
    <SpProviderWithAuth siteId="root">
      {/* Your app */}
    </SpProviderWithAuth>
  </SpAuthProvider>
</Theme>
```

Users will see "Sign in with Microsoft"; after login the token is stored and used for Graph API calls.

### Manual token or bypass (development)

```tsx
<SpAuthProvider bypassEnabled={true}>
  <SpProviderWithAuth siteId="root">
    {/* Your app */}
  </SpProviderWithAuth>
</SpAuthProvider>
```

## CLI Usage

```bash
# Interactive mode (default)
npx sp-generate-types --config sharepoint.config.ts

# Non-interactive mode (for CI/CD)
npx sp-generate-types --config sharepoint.config.ts --non-interactive

# With strategy
npx sp-generate-types --config sharepoint.config.ts --non-interactive --strategy first
# Strategies: interactive | first | error | all

# Clear cache
npx sp-generate-types --config sharepoint.config.ts --clear-cache
```

### Config Options

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `siteId` | `string` | Yes | SharePoint site ID |
| `tenantId` | `string` | Yes | Azure AD tenant ID |
| `clientId` | `string` | Yes | Azure AD app client ID |
| `defaultStrategy` | `string` | No | Default list selection strategy |
| `contentTypes` | `array` | Yes | Content types to generate |
| `options.outputDir` | `string` | No | Output directory (default: `./generated`) |
| `options.fieldNameMapping` | `object` | No | SharePoint field name to TS property name mapping |

### Content Type Config

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `contentTypeName` | `string` | Yes | SharePoint content type name |
| `outputType` | `string` | Yes | TypeScript interface name |
| `listId` | `string` | No | SharePoint list ID (optional) |
| `listName` | `string` | No | SharePoint list display name (optional) |
| `strategy` | `string` | No | Override default strategy |

### List Resolution Logic

1. If `listId` is provided, use it directly
2. If `listName` is provided, find the list by name
3. If neither is provided, scan all lists for the content type
   - If found in one list, use it
   - If found in multiple lists, ask the user (interactive) or apply strategy

## Error Handling

```typescript
import { SpError, SpAuthError, SpNotFoundError, SpThrottleError, SpValidationError } from '@mustafaaksoy/sharepoint-kit';

try {
  await client.getItem({ listId, itemId: '999' });
} catch (error) {
  if (error instanceof SpAuthError) {
    // 401/403 - redirect to login
  } else if (error instanceof SpNotFoundError) {
    // 404 - item not found
  } else if (error instanceof SpThrottleError) {
    // 429 - retryAfter available
    console.log(`Retry after ${error.retryAfter} seconds`);
  } else if (error instanceof SpValidationError) {
    // 400 - validation errors
    console.log(error.fieldErrors);
  }
}
```

## Type Mapping

| SharePoint Type | TypeScript Type |
|----------------|-----------------|
| Text, Note, Choice | `string` |
| MultiChoice | `string[]` |
| Number, Currency | `number` |
| Boolean | `boolean` |
| DateTime | `string` (ISO) |
| Lookup | `{ id: number; value: string }` |
| User | `{ id: number; email: string; displayName: string }` |
| URL | `{ url: string; description: string }` |

## License

MIT
