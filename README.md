<p align="center">
  <img src="https://img.shields.io/npm/v/@mustafaaksoy41/sharepoint-kit?style=for-the-badge&logo=npm" alt="npm version" />
  <img src="https://img.shields.io/npm/dt/@mustafaaksoy41/sharepoint-kit?style=for-the-badge" alt="downloads" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178c6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" alt="license" />
</p>

<h1 align="center">SharePoint Kit</h1>

<p align="center">
  <strong>TypeScript-first SharePoint geliştirme araç seti</strong>
</p>

<p align="center">
  Microsoft Graph API client, React hooks, Radix UI bileşenleri ve CLI type generator. Next.js App Router ve Pages Router ile uyumlu.
</p>

---

## Neden SharePoint Kit?

SharePoint’e Graph API üzerinden bağlanırken tip güvenliği, tekrarlayan kod ve auth karmaşıklığı sorunlarını çözmek için tasarlandı. Tek bir pakette:

- **Graph API client** – retry, throttle desteğiyle CRUD işlemleri  
- **React hooks** – SWR tabanlı `useSpList`, `useSpItem`, `useSpCreate` vb.  
- **Radix UI bileşenleri** – hazır `<SpListTable>`, `<SpItemForm>`, `<SpItemCard>`  
- **CLI type generator** – SharePoint content type’lardan otomatik TypeScript tipleri üretimi  
- **Config tabanlı** – Her proje kendi `sharepoint.config.ts` yapısını tanımlar  

---

## Kurulum

```bash
npm install @mustafaaksoy41/sharepoint-kit
```

### Peer bağımlılıklar

```bash
npm install react react-dom swr @radix-ui/themes @radix-ui/react-icons
```

---

## Hızlı Başlangıç

### 1. SharePoint’ten TypeScript tipleri üret

Proje kökünde `sharepoint.config.ts` oluştur:

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

CLI’ı çalıştır:

```bash
npx sp-generate-types --config sharepoint.config.ts
```

`./generated/sp-types.ts` üretilir:

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

### 2. Data client kullan

```typescript
import { createSpClient } from '@mustafaaksoy41/sharepoint-kit';
import type { Invoice } from './generated/sp-types';

const client = createSpClient({
  siteId: 'root',
  getAccessToken: async () => yourTokenFunction(),
});

// CRUD - tip güvenli
const items = await client.getListItems<Invoice>({
  listId: '50fc630f-...',
  contentTypeName: 'Fatura Denemesi',
});

const item = await client.getItem<Invoice>({ listId: '...', itemId: '6' });
const created = await client.createItem<Invoice>({ listId: '...', fields: { Tutar: 500 } });
const updated = await client.updateItem<Invoice>({ listId: '...', itemId: '6', fields: { Tutar: 600 } });
await client.deleteItem({ listId: '...', itemId: '6' });
```

### 3. React hooks kullan

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
    contentTypeName: 'Fatura Denemesi',
  });

  if (isLoading) return <p>Yükleniyor...</p>;
  if (error) return <p>Hata: {error.message}</p>;

  return (
    <ul>
      {data?.map((item) => (
        <li key={item.id}>{item.fields.Title} - {item.fields.Tutar}</li>
      ))}
    </ul>
  );
}
```

### 4. Radix UI bileşenleri

```tsx
import { SpProvider, SpListTable, SpItemForm, SpErrorBoundary } from '@mustafaaksoy41/sharepoint-kit/components';
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

---

## Kimlik Doğrulama

**Microsoft Login** (önerilen) veya **manuel token / bypass** kullanılabilir.

### Microsoft Login

`.env` dosyasına ekle (tarayıcıdan okunabilmesi için `NEXT_PUBLIC_` ile):

```env
NEXT_PUBLIC_SHAREPOINT_TENANT_ID=your-tenant-id
NEXT_PUBLIC_SHAREPOINT_CLIENT_ID=your-client-id
NEXT_PUBLIC_SHAREPOINT_REDIRECT_URI=http://localhost:3000
```

Azure AD: App Registration → Authentication → bu Redirect URI ile **SPA** ekle. API izinleri: **Sites.Read.All** (Delegated).

Uygulamayı `SpAuthProvider` + `loginConfig` ile sarmala:

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
      {/* Uygulama */}
    </SpProviderWithAuth>
  </SpAuthProvider>
</Theme>
```

Kullanıcı “Sign in with Microsoft” ile giriş yapar; token saklanır ve Graph API isteklerinde kullanılır.

### Manuel token veya bypass (geliştirme)

```tsx
<SpAuthProvider bypassEnabled={true}>
  <SpProviderWithAuth siteId="root">
    {/* Uygulama */}
  </SpProviderWithAuth>
</SpAuthProvider>
```

---

## CLI Kullanımı

```bash
# İnteraktif mod (varsayılan)
npx sp-generate-types --config sharepoint.config.ts

# CI/CD için non-interactive
npx sp-generate-types --config sharepoint.config.ts --non-interactive

# Strateji ile
npx sp-generate-types --config sharepoint.config.ts --non-interactive --strategy first
# Stratejiler: interactive | first | error | all

# Önbelleği temizle
npx sp-generate-types --config sharepoint.config.ts --clear-cache
```

### Config alanları

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `siteId` | `string` | Evet | SharePoint site ID |
| `tenantId` | `string` | Evet | Azure AD tenant ID |
| `clientId` | `string` | Evet | Azure AD app client ID |
| `defaultStrategy` | `string` | Hayır | Varsayılan liste seçim stratejisi |
| `contentTypes` | `array` | Evet | Tipleri üretilecek content type’lar |
| `options.outputDir` | `string` | Hayır | Çıktı klasörü (varsayılan: `./generated`) |
| `options.fieldNameMapping` | `object` | Hayır | SharePoint alan adı → TS property mapping |

### Content type config

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `contentTypeName` | `string` | Evet | Content type adı |
| `outputType` | `string` | Evet | Üretilecek TypeScript interface adı |
| `listId` | `string` | Hayır | Liste ID (opsiyonel) |
| `listName` | `string` | Hayır | Liste görünen adı (opsiyonel) |
| `strategy` | `string` | Hayır | Bu content type için strateji override |

### Liste çözümleme mantığı

1. `listId` verilmişse doğrudan kullanılır  
2. `listName` verilmişse ada göre liste bulunur  
3. İkisi de yoksa tüm listeler taranır:
   - Tek listede bulunursa o kullanılır  
   - Birden fazla listede bulunursa interaktif modda kullanıcıya sorulur, değilse strateji uygulanır  

---

## Hata yönetimi

```typescript
import { SpError, SpAuthError, SpNotFoundError, SpThrottleError, SpValidationError } from '@mustafaaksoy41/sharepoint-kit';

try {
  await client.getItem({ listId, itemId: '999' });
} catch (error) {
  if (error instanceof SpAuthError) {
    // 401/403 - login'e yönlendir
  } else if (error instanceof SpNotFoundError) {
    // 404 - kayıt bulunamadı
  } else if (error instanceof SpThrottleError) {
    // 429 - retryAfter mevcut
    console.log(`Şu kadar saniye sonra tekrar dene: ${error.retryAfter}`);
  } else if (error instanceof SpValidationError) {
    // 400 - doğrulama hataları
    console.log(error.fieldErrors);
  }
}
```

---

## Tip eşlemesi

| SharePoint tipi | TypeScript tipi |
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

## Lisans

MIT
