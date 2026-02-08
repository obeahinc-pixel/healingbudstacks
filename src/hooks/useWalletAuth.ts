/**
 * useWalletAuth Hook
 * 
 * Implements Sign-In with Ethereum (SIWE) for admin wallet authentication.
 * Flow:
 * 1. User connects MetaMask wallet
 * 2. Signs a timestamped auth message
 * 3. Edge function verifies signature + checks wallet authorization
 * 4. Returns OTP token → frontend establishes Supabase session
 */

import { useState, useCallback } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WalletAuthState {
  isAuthenticating: boolean;
  error: string | null;
}

export function useWalletAuth() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { toast } = useToast();
  const [state, setState] = useState<WalletAuthState>({
    isAuthenticating: false,
    error: null,
  });

  /**
   * Build the SIWE-style authentication message.
   * Includes wallet address and a timestamp for replay protection.
   */
  const buildAuthMessage = useCallback((walletAddress: string): string => {
    const timestamp = Date.now();
    return [
      'Healing Buds Admin Authentication',
      '',
      'I am signing in to the Healing Buds admin portal.',
      '',
      `Wallet: ${walletAddress}`,
      `Timestamp: ${timestamp}`,
    ].join('\n');
  }, []);

  /**
   * Initiate wallet-based authentication.
   * Requests signature from MetaMask, verifies server-side, establishes session.
   */
  const authenticateWithWallet = useCallback(async (): Promise<boolean> => {
    if (!isConnected || !address) {
      setState({ isAuthenticating: false, error: 'Please connect your wallet first.' });
      return false;
    }

    setState({ isAuthenticating: true, error: null });

    try {
      // 1. Build auth message
      const message = buildAuthMessage(address);

      // 2. Request signature from wallet
      let signature: string;
      try {
        signature = await signMessageAsync({ message, account: address });
      } catch (signError: any) {
        // User rejected the signature request
        if (signError?.code === 4001 || signError?.message?.includes('rejected')) {
          setState({ isAuthenticating: false, error: null });
          return false;
        }
        throw signError;
      }

      // 3. Send to edge function for verification
      const { data, error: fnError } = await supabase.functions.invoke('wallet-auth', {
        body: { message, signature, address },
      });

      if (fnError) {
        const errorMsg = fnError.message || 'Authentication failed';
        setState({ isAuthenticating: false, error: errorMsg });
        toast({
          title: 'Authentication Failed',
          description: errorMsg,
          variant: 'destructive',
        });
        return false;
      }

      if (!data?.success) {
        const errorMsg = data?.error || data?.detail || 'Wallet not authorized';
        setState({ isAuthenticating: false, error: errorMsg });
        toast({
          title: 'Access Denied',
          description: errorMsg,
          variant: 'destructive',
        });
        return false;
      }

      // 4. Use OTP to establish Supabase session
      const { error: otpError } = await supabase.auth.verifyOtp({
        email: data.email,
        token: data.token,
        type: 'email',
      });

      if (otpError) {
        console.error('[useWalletAuth] OTP verification failed:', otpError);
        setState({ isAuthenticating: false, error: 'Session creation failed. Please try again.' });
        toast({
          title: 'Session Error',
          description: 'Could not establish session. Please try again.',
          variant: 'destructive',
        });
        return false;
      }

      // 5. Success!
      setState({ isAuthenticating: false, error: null });
      toast({
        title: 'Welcome, Admin',
        description: `Signed in with wallet ${address.slice(0, 6)}...${address.slice(-4)}`,
      });

      return true;

    } catch (err: any) {
      console.error('[useWalletAuth] Unexpected error:', err);
      const errorMsg = err?.message || 'An unexpected error occurred';
      setState({ isAuthenticating: false, error: errorMsg });
      toast({
        title: 'Authentication Error',
        description: errorMsg,
        variant: 'destructive',
      });
      return false;
    }
  }, [address, isConnected, signMessageAsync, buildAuthMessage, toast]);

  return {
    authenticateWithWallet,
    isAuthenticating: state.isAuthenticating,
    error: state.error,
    isWalletConnected: isConnected,
    walletAddress: address,
  };
}
