import { useCallback } from 'react';
import { SpProvider, type SpProviderProps } from './sp-provider.js';
import { useSpAuth } from './sp-auth-provider.js';

export interface SpProviderWithAuthProps extends Omit<SpProviderProps, 'getAccessToken'> {
  // bypass SpAuthProvider'dan geliyor
}

/**
 * SpProvider wrapper that automatically uses SpAuthProvider for authentication.
 * Use this if you want the built-in auth system with login screen.
 *
 * For custom auth systems, use SpProvider directly with your own getAccessToken.
 */
export function SpProviderWithAuth({
  siteId,
  children,
  baseUrl,
  retryOptions,
}: SpProviderWithAuthProps) {
  const { token, bypass } = useSpAuth();

  const getAccessToken = useCallback(async () => {
    if (bypass) {
      return 'bypass-token';
    }
    if (!token) {
      throw new Error('No access token available. Please authenticate.');
    }
    return token;
  }, [token, bypass]);

  return (
    <SpProvider
      siteId={siteId}
      getAccessToken={getAccessToken}
      baseUrl={baseUrl}
      retryOptions={retryOptions}
    >
      {children}
    </SpProvider>
  );
}
