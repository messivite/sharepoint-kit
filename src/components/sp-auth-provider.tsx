import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { Theme, Card, TextField, Button, Flex, Text, Box, Separator } from '@radix-ui/themes';
import { LockClosedIcon, PersonIcon, ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons';
import type { SpLoginConfig } from '../cli/config-loader.js';
import { loginWithRedirect, handleRedirectPromise } from '../auth/msal-browser.js';

interface AuthContextValue {
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  bypass: boolean;
  setBypass: (bypass: boolean) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const MICROSOFT_BLUE = '#00a4ef';

/** Simple Microsoft logo SVG (M in a square) for "Sign in with Microsoft" button */
function MicrosoftLogoIcon({ size = 21 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 21 21"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <rect width="10" height="10" fill="#F25022" />
      <rect x="11" width="10" height="10" fill="#7FBA00" />
      <rect y="11" width="10" height="10" fill="#00A4EF" />
      <rect x="11" y="11" width="10" height="10" fill="#FFB900" />
    </svg>
  );
}

export interface SpAuthProviderProps {
  children: React.ReactNode;
  /** When set, shows "Sign in with Microsoft" and uses MSAL redirect flow. Can be built from env (e.g. NEXT_PUBLIC_*). */
  loginConfig?: SpLoginConfig;
  bypassEnabled?: boolean;
  onTokenChange?: (token: string | null) => void;
}

export function SpAuthProvider({
  children,
  loginConfig,
  bypassEnabled = false,
  onTokenChange,
}: SpAuthProviderProps) {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sp-kit-token');
    }
    return null;
  });
  const [bypass, setBypass] = useState(bypassEnabled);
  const [manualToken, setManualToken] = useState('');
  const [manualTokenOpen, setManualTokenOpen] = useState(false);
  const redirectCheckDone = useRef(false);

  useEffect(() => {
    if (onTokenChange) {
      onTokenChange(token);
    }
  }, [token, onTokenChange]);

  const login = useCallback((newToken: string) => {
    setToken(newToken);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sp-kit-token', newToken);
    }
    setBypass(false);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sp-kit-token');
    }
  }, []);

  const handleManualLogin = useCallback(() => {
    if (manualToken.trim()) {
      login(manualToken.trim());
    }
  }, [manualToken, login]);

  // Microsoft OAuth redirect sonrası token'ı al
  useEffect(() => {
    if (!loginConfig || redirectCheckDone.current || typeof window === 'undefined') return;
    redirectCheckDone.current = true;
    handleRedirectPromise(loginConfig)
      .then((result) => {
        if (result) {
          login(result.accessToken);
        }
      })
      .catch(() => {
        redirectCheckDone.current = false;
      });
  }, [loginConfig, login]);

  const handleMicrosoftLogin = useCallback(() => {
    if (!loginConfig) return;
    loginWithRedirect(loginConfig);
  }, [loginConfig]);

  const isAuthenticated = bypass || !!token;

  if (!isAuthenticated) {
    const showMicrosoftFirst = !!loginConfig;
    return (
      <Theme>
        <Box
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--gray-2)',
            padding: '1rem',
          }}
        >
          <Card style={{ width: '100%', maxWidth: '400px' }}>
            <Flex direction="column" gap="4" p="4">
              <Flex direction="column" gap="2" align="center">
                <Box
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: showMicrosoftFirst ? MICROSOFT_BLUE : 'var(--accent-9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <LockClosedIcon width="24" height="24" color="white" />
                </Box>
                <Text size="5" weight="bold">
                  {showMicrosoftFirst ? "Sign in to SharePoint" : "SharePoint Authentication"}
                </Text>
                <Text size="2" color="gray" align="center">
                  {showMicrosoftFirst
                    ? "Sign in with your Microsoft account to continue"
                    : "Enter your access token to continue"}
                </Text>
              </Flex>

              <Separator size="4" />

              <Flex direction="column" gap="3">
                {showMicrosoftFirst && (
                  <Button
                    size="3"
                    onClick={handleMicrosoftLogin}
                    style={{
                      width: '100%',
                      backgroundColor: MICROSOFT_BLUE,
                      color: 'white',
                    }}
                  >
                    <MicrosoftLogoIcon />
                    Sign in with Microsoft
                  </Button>
                )}

                {showMicrosoftFirst && (
                  <Button
                    variant="soft"
                    size="2"
                    style={{ width: '100%' }}
                    onClick={() => setManualTokenOpen((o) => !o)}
                  >
                    Token ile giris
                    {manualTokenOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                  </Button>
                )}

                {(showMicrosoftFirst ? manualTokenOpen : true) && (
                  <Flex direction="column" gap="3">
                    <Box>
                      <Text as="label" size="2" weight="medium" mb="1" style={{ display: 'block' }}>
                        Access Token
                      </Text>
                      <TextField.Root
                        type="password"
                        placeholder="Enter your SharePoint access token"
                        value={manualToken}
                        onChange={(e) => setManualToken(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleManualLogin();
                          }
                        }}
                        size="3"
                      >
                        <TextField.Slot>
                          <PersonIcon />
                        </TextField.Slot>
                      </TextField.Root>
                    </Box>
                    <Button
                      size="3"
                      variant={showMicrosoftFirst ? 'soft' : 'solid'}
                      onClick={handleManualLogin}
                      disabled={!manualToken.trim()}
                      style={{ width: '100%' }}
                    >
                      <LockClosedIcon />
                      Sign In
                    </Button>
                  </Flex>
                )}

                {bypassEnabled && (
                  <>
                    <Separator size="4" />
                    <Button
                      variant="soft"
                      size="2"
                      onClick={() => setBypass(true)}
                      style={{ width: '100%' }}
                    >
                      Bypass (Development)
                    </Button>
                  </>
                )}
              </Flex>

              <Text size="1" color="gray" align="center">
                Your token is stored locally and never sent to external servers
              </Text>
            </Flex>
          </Card>
        </Box>
      </Theme>
    );
  }

  return (
    <AuthContext.Provider value={{ token, isAuthenticated, login, logout, bypass, setBypass }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useSpAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useSpAuth must be used within a <SpAuthProvider>');
  }
  return context;
}
