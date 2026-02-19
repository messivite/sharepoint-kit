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

### 1. Environment variables

Create a `.env` file in your project root (the CLI loads it automatically via dotenv):

```env
SHAREPOINT_SITE_ID=root
SHAREPOINT_TENANT_ID=your-tenant-id
SHAREPOINT_CLIENT_ID=your-client-id
SHAREPOINT_CLIENT_SECRET=your-client-secret
```

### 2. Config file

Create `sharepoint.config.ts` (or `sharepoint.config.json`):

```typescript
export default {
  siteId: process.env.SHAREPOINT_SITE_ID || 'root',
  tenantId: process.env.SHAREPOINT_TENANT_ID,
  clientId: process.env.SHAREPOINT_CLIENT_ID,
  clientSecret: process.env.SHAREPOINT_CLIENT_SECRET,
  defaultStrategy: 'interactive',
  contentTypes: [
    {
      listId: '50fc630f-3495-4fc1-81e4-dfa7ef915574',  // use listId for document libraries
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
      'M_x00fc__x015f_teri_x0020_No': 'musteriNo',
    },
  },
};
```

### 3. Run the type generator

```bash
npx sp-generate-types -c sharepoint.config.ts
```

For CI/CD (non-interactive):

```bash
npx sp-generate-types -c sharepoint.config.ts --non-interactive
```

Terminal output:

```
SharePoint Kit - Type Generator

Site: root
Strategy: interactive
Output: ./generated/sp-types.ts

Scanning SharePoint site...

Processing: "Fatura Denemesi" -> Invoice
  Found list "Belgeler" (50fc630f-3495-4fc1-81e4-dfa7ef915574)
Processing: "Belge" -> Document
  Scanning lists for content type "Belge"...
  Found content type "Belge" in list "Belgeler"
  Generating interface "Invoice" from list "Belgeler"...
  Generating interface "Document" from list "Belgeler"...
```

This generates `./generated/sp-types.ts`:

```typescript
export interface Invoice {
  faturaNo?: string;
  musteriNo?: string;
  Tutar?: number;
  Title?: string;
}

export interface Document {
  Title?: string;
}
```

### 4. Why `fieldNameMapping`?

SharePoint returns column **InternalNames** in an encoded format. Spaces and special characters become hex codes:

| Display name | InternalName (from Graph API) |
|--------------|------------------------------|
| Fatura Numarası | `Fatura_x0020_Numaras_x0131_` |
| Müşteri No | `M_x00fc__x015f_teri_x0020_No` |

Without mapping, you'd get ugly property names in TypeScript. The mapping converts them to camelCase:

```typescript
fieldNameMapping: {
  'Fatura_x0020_Numaras_x0131_': 'faturaNo',
  'M_x00fc__x015f_teri_x0020_No': 'musteriNo',
}
```

**Important:** The mapping key must match the InternalName exactly (including typos like `Np` vs `No`). Check the generated file or Graph API response if a field isn't being mapped.

### 5. `listId` vs `listName`

For document libraries (e.g. Shared Documents / Belgeler), **`listId` is more reliable**. The Graph API `getLists()` result can vary by tenant or locale. If you know the list ID from the URL (`/sites/root/lists/{list-id}/items`), use it directly:

```typescript
{ listId: '50fc630f-3495-4fc1-81e4-dfa7ef915574', contentTypeName: 'Fatura Denemesi', outputType: 'Invoice' }
```

### 6. Use the data client

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

### 7. Use React hooks

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

### 8. Radix UI components

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

### What the CLI does (under the hood)

1. Loads config and fetches an access token (client credentials flow)
2. Resolves each content type to a list (by `listId`, `listName`, or scanning)
3. Calls Graph API: `getListContentTypes`, `getColumns` / `getListColumns`
4. Maps column types from Graph's format (`text`, `number`, `currency` etc.) to TypeScript
5. Applies `fieldNameMapping` to rename encoded InternalNames to camelCase
6. Writes `sp-types.ts` to the output directory

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

The Microsoft Graph API returns column definitions with properties like `text`, `number`, `currency` rather than a single `type` string. These map to TypeScript as follows:

| Graph API / SharePoint Type | TypeScript Type |
|-----------------------------|-----------------|
| text, text (multiline), choice | `string` |
| multiSelect | `string[]` |
| number, currency | `number` |
| boolean | `boolean` |
| dateTime | `string` (ISO) |
| lookup | `{ id: number; value: string }` |
| personOrGroup | `{ id: number; email: string; displayName: string }` |
| url | `{ url: string; description: string }` |

---

## License

MIT
