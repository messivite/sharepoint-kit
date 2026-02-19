<p align="center">
  <a href="https://www.npmjs.com/package/@mustafaaksoy41/sharepoint-kit">
    <img src="https://img.shields.io/npm/v/@mustafaaksoy41/sharepoint-kit?style=for-the-badge&logo=npm" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@mustafaaksoy41/sharepoint-kit">
    <img src="https://img.shields.io/npm/dt/@mustafaaksoy41/sharepoint-kit?style=for-the-badge" alt="downloads" />
  </a>
  <a href="https://www.typescriptlang.org/">
    <img src="https://img.shields.io/badge/TypeScript-5.x-3178c6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  </a>
  <a href="https://github.com/messivite/sharepoint-kit/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" alt="license" />
  </a>
</p>

<h1 align="center">SharePoint Kit</h1>

<p align="center">
  <strong>TypeScript-first SharePoint development toolkit</strong>
</p>

<p align="center">
  Microsoft Graph API client, React hooks, Radix UI components, and CLI type generator. Works with Next.js App Router and Pages Router.
</p>

---

## Why SharePoint Kit?

Built to solve type safety, boilerplate, and auth complexity when connecting to SharePoint via the Graph API. Everything in one package:

- **Graph API client** – CRUD with retry and throttle handling
- **React hooks** – SWR-based `useSpList`, `useSpItem`, `useSpCreate`, and more
- **Radix UI components** – Ready-to-use `<SpListTable>`, `<SpItemForm>`, `<SpItemCard>`
- **CLI type generator** – Generate TypeScript types from SharePoint content types
- **Config-driven** – Each project defines its SharePoint structure in `sharepoint.config.ts`

---

## Installation

```bash
npm install @mustafaaksoy41/sharepoint-kit
```

### Peer dependencies

```bash
npm install react react-dom swr @radix-ui/themes @radix-ui/react-icons
```

---

## Quick Start

### 1. Generate TypeScript types from SharePoint

Create `sharepoint.config.ts` in your project root:

```typescript
export default {
  siteId: 'root',
  tenantId: process.env.SHAREPOINT_TENANT_ID,
  clientId: process.env.SHAREPOINT_CLIENT_ID,
  defaultStrategy: 'interactive',
  contentTypes: [
    {
      listName: 'Invoices',
      contentTypeName: 'Invoice',
      outputType: 'Invoice',
    },
    {
      contentTypeName: 'Document',
      outputType: 'Document',
    },
  ],
  options: {
    outputDir: './generated',
    fieldNameMapping: {
      'Invoice_x0020_Number': 'invoiceNo',
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
  invoiceNo?: string;
  Amount?: number;
  Title?: string;
}

export interface Document {
  Title?: string;
}
```

### 2. Use the data client

```typescript
import { createSpClient } from '@mustafaaksoy41/sharepoint-kit';
import type { Invoice } from './generated/sp-types';

const client = createSpClient({
  siteId: 'root',
  getAccessToken: async () => yourTokenFunction(),
});

// CRUD with full type safety
const items = await client.getListItems<Invoice>({
  listId: '50fc630f-...',
  contentTypeName: 'Invoice',
});

const item = await client.getItem<Invoice>({ listId: '...', itemId: '6' });
const created = await client.createItem<Invoice>({ listId: '...', fields: { Amount: 500 } });
const updated = await client.updateItem<Invoice>({ listId: '...', itemId: '6', fields: { Amount: 600 } });
await client.deleteItem({ listId: '...', itemId: '6' });
```

### 3. Use React hooks

```tsx
import { SpProvider } from '@mustafaaksoy41/sharepoint-kit/components';
import { useSpList, useSpItem, useSpCreate } from '@mustafaaksoy41/sharepoint-kit/hooks';
import type { Invoice } from './generated/sp-types';

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
    contentTypeName: 'Invoice',
  });

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <ul>
      {data?.map((item) => (
        <li key={item.id}>{item.fields.Title} - {item.fields.Amount}</li>
      ))}
    </ul>
  );
}
```

### 4. Radix UI components

```tsx
import { SpProvider, SpListTable, SpItemForm, SpErrorBoundary } from '@mustafaaksoy41/sharepoint-kit/components';
import type { Invoice } from './generated/sp-types';

function App() {
  return (
    <SpProvider config={{ siteId: 'root', getAccessToken }}>
      <SpErrorBoundary onAuthError={() => router.push('/login')}>
        <SpListTable<Invoice>
          listId="50fc630f-..."
          contentTypeName="Invoice"
          columns={[
            { key: 'invoiceNo', label: 'Invoice No' },
            { key: 'Amount', label: 'Amount', format: 'currency' },
          ]}
          onRowClick={(item, id) => router.push(`/invoices/${id}`)}
        />
      </SpErrorBoundary>
    </SpProvider>
  );
}
```

---

## Authentication

You can use **Microsoft Login** (recommended) or **manual token / bypass**.

### Microsoft Login

Add to your `.env` (use `NEXT_PUBLIC_` so the browser can read them):

```env
NEXT_PUBLIC_SHAREPOINT_TENANT_ID=your-tenant-id
NEXT_PUBLIC_SHAREPOINT_CLIENT_ID=your-client-id
NEXT_PUBLIC_SHAREPOINT_REDIRECT_URI=http://localhost:3000
```

In Azure AD: App Registration → Authentication → add **SPA** with this Redirect URI. API permissions: **Sites.Read.All** (Delegated).

Wrap your app with `SpAuthProvider` and `loginConfig`:

```tsx
import { SpAuthProvider, SpProviderWithAuth, type SpLoginConfig } from '@mustafaaksoy41/sharepoint-kit/components';
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

Users sign in with "Sign in with Microsoft"; the token is stored and used for Graph API calls.

### Manual token or bypass (development)

```tsx
<SpAuthProvider bypassEnabled={true}>
  <SpProviderWithAuth siteId="root">
    {/* Your app */}
  </SpProviderWithAuth>
</SpAuthProvider>
```

---

## CLI usage

```bash
# Interactive mode (default)
npx sp-generate-types --config sharepoint.config.ts

# Non-interactive for CI/CD
npx sp-generate-types --config sharepoint.config.ts --non-interactive

# With strategy
npx sp-generate-types --config sharepoint.config.ts --non-interactive --strategy first
# Strategies: interactive | first | error | all

# Clear cache
npx sp-generate-types --config sharepoint.config.ts --clear-cache
```

### Config options

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `siteId` | `string` | Yes | SharePoint site ID |
| `tenantId` | `string` | Yes | Azure AD tenant ID |
| `clientId` | `string` | Yes | Azure AD app client ID |
| `defaultStrategy` | `string` | No | Default list selection strategy |
| `contentTypes` | `array` | Yes | Content types to generate |
| `options.outputDir` | `string` | No | Output directory (default: `./generated`) |
| `options.fieldNameMapping` | `object` | No | SharePoint field name → TS property mapping |

### Content type config

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `contentTypeName` | `string` | Yes | Content type name |
| `outputType` | `string` | Yes | TypeScript interface name to generate |
| `listId` | `string` | No | SharePoint list ID (optional) |
| `listName` | `string` | No | List display name (optional) |
| `strategy` | `string` | No | Override strategy for this content type |

### List resolution logic

1. If `listId` is provided, use it directly
2. If `listName` is provided, find the list by name
3. If neither is provided, scan all lists for the content type:
   - If found in one list, use it
   - If found in multiple lists, prompt the user (interactive) or apply the strategy

---

## Error handling

```typescript
import { SpError, SpAuthError, SpNotFoundError, SpThrottleError, SpValidationError } from '@mustafaaksoy41/sharepoint-kit';

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

---

## Type mapping

| SharePoint Type | TypeScript Type |
|-----------------|-----------------|
| Text, Note, Choice | `string` |
| MultiChoice | `string[]` |
| Number, Currency | `number` |
| Boolean | `boolean` |
| DateTime | `string` (ISO) |
| Lookup | `{ id: number; value: string }` |
| User | `{ id: number; email: string; displayName: string }` |
| URL | `{ url: string; description: string }` |

---

## License

MIT
