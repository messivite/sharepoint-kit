import type { SpKitConfig } from './src/cli/config-loader.js';

// Copy this file to sharepoint.config.ts and fill in your values.
// Required env vars: SHAREPOINT_TENANT_ID, SHAREPOINT_CLIENT_ID, SHAREPOINT_CLIENT_SECRET

const config: SpKitConfig = {
  siteId: process.env.SHAREPOINT_SITE_ID || 'root',
  tenantId: process.env.SHAREPOINT_TENANT_ID,
  clientId: process.env.SHAREPOINT_CLIENT_ID,
  clientSecret: process.env.SHAREPOINT_CLIENT_SECRET,
  defaultStrategy: 'interactive',
  contentTypes: [
    {
      listId: 'your-list-id', // or listName: 'Your List Display Name'
      contentTypeName: 'Your Content Type Name',
      outputType: 'Invoice',
    },
  ],
  options: {
    outputDir: './generated',
    fieldNameMapping: {
      // SharePoint InternalName -> camelCase property name
      // e.g. 'Column_x0020_Name': 'columnName',
    },
  },
};

export default config;
