import React, { createContext, useContext, useMemo } from 'react';
import { createSpClient } from '../client/sp-client.js';
import type { SpClientConfig } from '../client/types.js';

// --- REACT 18 POLYFILL FOR SPFX (React 17) ---
// Framer Motion ve Radix UI'ın eski React sürümlerinde çökmesini engeller.
if (typeof window !== 'undefined' && typeof (React as any).useInsertionEffect === 'undefined') {
  (React as any).useInsertionEffect = React.useLayoutEffect || React.useEffect;
}
if (typeof window !== 'undefined' && typeof (React as any).useId === 'undefined') {
  let _idCounter = Math.floor(Math.random() * 10000);
  (React as any).useId = () => {
    return 'sp-kit-id-' + Math.random().toString(36).substring(2, 7) + '-' + (_idCounter++);
  };
}
type SpClientInstance = ReturnType<typeof createSpClient>;

interface SpContextValue {
  client: SpClientInstance;
  config: SpClientConfig;
}

const SpContext = createContext<SpContextValue | null>(null);

export interface SpProviderProps {
  siteId: string;
  getAccessToken: () => Promise<string>;
  children: React.ReactNode;
  baseUrl?: string;
  retryOptions?: SpClientConfig['retryOptions'];
}

export function SpProvider({
  siteId,
  getAccessToken,
  children,
  baseUrl,
  retryOptions,
}: SpProviderProps) {
  const config = useMemo<SpClientConfig>(() => {
    return {
      siteId,
      baseUrl,
      retryOptions,
      getAccessToken,
    };
  }, [siteId, baseUrl, retryOptions, getAccessToken]);

  const value = useMemo(() => {
    const client = createSpClient(config);
    return { client, config };
  }, [config]);

  return <SpContext.Provider value={value}>{children}</SpContext.Provider>;
}

export function useSpContext(): SpContextValue {
  const context = useContext(SpContext);
  if (!context) {
    throw new Error('useSpContext must be used within a <SpProvider>');
  }
  return context;
}
