import type { SpLoginConfig } from '../cli/config-loader.js';
import {
  type Configuration,
  type IPublicClientApplication,
  type RedirectRequest,
  PublicClientApplication,
} from '@azure/msal-browser';

const DEFAULT_SCOPES = ['https://graph.microsoft.com/.default'];

/**
 * Build MSAL Configuration from SpLoginConfig.
 */
function buildMsalConfig(config: SpLoginConfig): Configuration {
  const tenantId = config.tenantId.replace(/\/$/, '');
  return {
    auth: {
      clientId: config.clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
      redirectUri: config.redirectUri,
    },
  };
}

let cachedInstance: IPublicClientApplication | null = null;
let cachedConfigKey: string | null = null;

/**
 * Get or create a single MSAL PublicClientApplication instance for the given config.
 * Reuses the same instance when config matches (by key).
 */
export async function getMsalInstance(config: SpLoginConfig): Promise<IPublicClientApplication> {
  const key = `${config.tenantId}:${config.clientId}:${config.redirectUri}`;
  if (cachedInstance && cachedConfigKey === key) {
    return cachedInstance;
  }
  const msalConfig = buildMsalConfig(config);
  const instance = await PublicClientApplication.createPublicClientApplication(msalConfig);
  cachedInstance = instance;
  cachedConfigKey = key;
  return instance;
}

/**
 * Start the Microsoft login flow by redirecting the user to Azure AD.
 * The page will redirect away; after sign-in, Azure redirects back to redirectUri.
 */
export async function loginWithRedirect(config: SpLoginConfig): Promise<void> {
  const instance = await getMsalInstance(config);
  const scopes = config.scopes ?? DEFAULT_SCOPES;
  const request: RedirectRequest = { scopes };
  await instance.loginRedirect(request);
}

/**
 * Handle the redirect when returning from Azure AD after sign-in.
 * Call this once on app load (e.g. in useEffect). Returns the token if this load was a redirect callback.
 */
export async function handleRedirectPromise(
  config: SpLoginConfig
): Promise<{ accessToken: string } | null> {
  const instance = await getMsalInstance(config);
  const result = await instance.handleRedirectPromise();
  if (!result) return null;
  return { accessToken: result.accessToken };
}
