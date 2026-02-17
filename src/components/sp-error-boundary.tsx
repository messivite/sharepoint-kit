import React, { Component } from 'react';
import { Callout, Button, Flex, Text } from '@radix-ui/themes';
import { SpAuthError, SpThrottleError, SpError } from '../client/errors.js';

interface SpErrorBoundaryProps {
  children: React.ReactNode;
  onAuthError?: () => void;
  fallback?: React.ReactNode;
}

interface SpErrorBoundaryState {
  error: Error | null;
}

export class SpErrorBoundary extends Component<SpErrorBoundaryProps, SpErrorBoundaryState> {
  constructor(props: SpErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): SpErrorBoundaryState {
    return { error };
  }

  handleRetry = () => {
    this.setState({ error: null });
  };

  handleAuthError = () => {
    const { onAuthError } = this.props;
    if (onAuthError) {
      onAuthError();
    } else {
      // Default: logout and show login screen
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sp-kit-token');
        window.location.reload();
      }
    }
  };

  render() {
    const { error } = this.state;
    const { children, fallback } = this.props;

    if (!error) {
      return children;
    }

    if (fallback) {
      return fallback;
    }

    if (error instanceof SpAuthError) {
      return (
        <Callout.Root color="orange">
          <Flex direction="column" gap="2">
            <Callout.Text>
              Session expired or authorization error. Please login again.
            </Callout.Text>
            <Button variant="soft" onClick={this.handleAuthError}>
              Login Again
            </Button>
          </Flex>
        </Callout.Root>
      );
    }

    if (error instanceof SpThrottleError) {
      return (
        <Callout.Root color="yellow">
          <Flex direction="column" gap="2">
            <Callout.Text>
              Too many requests. Please wait a moment and try again.
            </Callout.Text>
            <Text size="1" color="gray">
              {error.retryAfter > 0
                ? `Estimated wait time: ${error.retryAfter} seconds`
                : 'Please try again later'}
            </Text>
            <Button variant="soft" onClick={this.handleRetry}>
              Retry
            </Button>
          </Flex>
        </Callout.Root>
      );
    }

    const spError = error instanceof SpError ? error : null;

    return (
      <Callout.Root color="red">
        <Flex direction="column" gap="2">
          <Callout.Text>{error.message}</Callout.Text>
          {spError && (
            <Text size="1" color="gray">
              Error code: {spError.code} | Status: {spError.status}
            </Text>
          )}
          <Button variant="soft" onClick={this.handleRetry}>
            Retry
          </Button>
        </Flex>
      </Callout.Root>
    );
  }
}
