# SharePoint Kit Entegrasyon Rehberi

## 1. Paketi Projenize Ekleyin

### Local Development (npm link)

```bash
# sharepoint-kit klasöründe
cd /Users/mustafaaksoy/Projects/sharepoint-kit
npm link

# Projenizde
cd /path/to/your/project
npm link @mustafaaksoy41/sharepoint-kit
```

### veya npm publish sonrası

```bash
cd /path/to/your/project
npm install @mustafaaksoy41/sharepoint-kit
```

## 2. Environment Variables (.env)

`.env` dosyasına SharePoint bilgilerinizi ekleyin:

```env
SHAREPOINT_SITE_ID=root
SHAREPOINT_TENANT_ID=your-tenant-id
SHAREPOINT_CLIENT_ID=your-client-id
SHAREPOINT_CLIENT_SECRET=your-client-secret
```

**Microsoft Login (SPA) için** tarayıcıda kullanılacak değişkenler (Next.js örnek; `NEXT_PUBLIC_` ile başlamalı):

```env
NEXT_PUBLIC_SHAREPOINT_TENANT_ID=your-tenant-id
NEXT_PUBLIC_SHAREPOINT_CLIENT_ID=your-client-id
NEXT_PUBLIC_SHAREPOINT_REDIRECT_URI=http://localhost:3000
```

- `SHAREPOINT_CLIENT_SECRET` sadece sunucu/CLI tarafında kullanılır; tarayıcıda kullanılmaz.
- Azure AD > App Registration > Authentication'da **SPA** platformu ekleyip Redirect URI'yi (örn. `http://localhost:3000`) kaydedin.

## 3. SharePoint Config Dosyası

`sharepoint.config.ts` dosyası oluşturun ve content type'larınızı tanımlayın.

## 4. Type Generation

```bash
npx sp-generate-types --config sharepoint.config.ts
```

## 5. Projede Kullanım

### Microsoft Login ile (önerilen)

Uygulama açılışında "Sign in with Microsoft" ekranı çıkar; giriş sonrası token otomatik kullanılır.

```tsx
import { SpAuthProvider, SpProviderWithAuth, SpListTable, type SpLoginConfig } from '@mustafaaksoy41/sharepoint-kit/components';
import { Theme } from '@radix-ui/themes';
import type { Invoice } from './generated/sp-types';

const loginConfig: SpLoginConfig = {
  tenantId: process.env.NEXT_PUBLIC_SHAREPOINT_TENANT_ID!,
  clientId: process.env.NEXT_PUBLIC_SHAREPOINT_CLIENT_ID!,
  redirectUri: process.env.NEXT_PUBLIC_SHAREPOINT_REDIRECT_URI!,
};

function App() {
  return (
    <Theme>
      <SpAuthProvider loginConfig={loginConfig}>
        <SpProviderWithAuth siteId="root">
          <SpListTable<Invoice>
            listId="your-list-id"
            contentTypeName="Fatura Denemesi"
            columns={[
              { key: 'faturaNo', label: 'Fatura No' },
              { key: 'Tutar', label: 'Tutar', format: 'currency' },
            ]}
          />
        </SpProviderWithAuth>
      </SpAuthProvider>
    </Theme>
  );
}
```

### Kendi auth sisteminizle (SpProvider + getAccessToken)

```tsx
import { SpProvider, SpListTable } from '@mustafaaksoy41/sharepoint-kit/components';
import { useSession } from 'next-auth/react'; // veya kendi auth
import type { Invoice } from './generated/sp-types';

function MySharePointComponent() {
  const { data: session } = useSession();

  return (
    <SpProvider
      config={{
        siteId: process.env.NEXT_PUBLIC_SHAREPOINT_SITE_ID || 'root',
        getAccessToken: async () => session?.accessToken ?? '',
      }}
    >
      <SpListTable<Invoice>
        listId="your-list-id"
        contentTypeName="Fatura Denemesi"
        columns={[
          { key: 'faturaNo', label: 'Fatura No' },
          { key: 'Tutar', label: 'Tutar', format: 'currency' },
        ]}
      />
    </SpProvider>
  );
}
```

### Server-side API Route Örneği

```typescript
import { createSpClient } from '@mustafaaksoy41/sharepoint-kit';
import type { Invoice } from '@/generated/sp-types';

export async function GET() {
  const client = createSpClient({
    siteId: process.env.SHAREPOINT_SITE_ID!,
    getAccessToken: async () => {
      // Token alma mantığınız
      return yourToken;
    },
  });

  const items = await client.getListItems<Invoice>({
    listId: process.env.SHAREPOINT_LIST_ID!,
    contentTypeName: 'Fatura Denemesi',
  });

  return Response.json(items);
}
```
