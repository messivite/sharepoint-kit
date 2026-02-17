import type { SpKitConfig } from './src/cli/config-loader.js';

const config: SpKitConfig = {
  siteId: process.env.SHAREPOINT_SITE_ID || 'root',
  tenantId: process.env.SHAREPOINT_TENANT_ID,
  clientId: process.env.SHAREPOINT_CLIENT_ID,
  clientSecret: process.env.SHAREPOINT_CLIENT_SECRET,
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
      'M_x00fc__x015f_teri_x0020_No': 'musteriNo',
    },
  },
};

export default config;
