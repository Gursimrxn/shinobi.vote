'use client';

import React, { useState, useEffect } from 'react';
import { SelfQRcodeWrapper, SelfApp, SelfAppBuilder } from '@selfxyz/qrcode';
import { getSelfFrontendConfig } from '@/config/self';
import {
SelfVerificationData,
SelfVerificationComponentProps,
} from '@/types/self';

type ViewState = 'loading' | 'ready' | 'verified' | 'error';

interface BuildResult {
  app: SelfApp;
  universalLink: string;
  userAddress: string;
  websocketUrl: string;
}

const buildSelfApp = (): BuildResult => {
  const config = getSelfFrontendConfig();
  const userId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  const sessionSeed =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  // Self Protocol requires HTTPS endpoints accessible from mobile
  // For development, we need to use a tunnel or Self's demo API
  const isDevelopment = process.env.NODE_ENV === 'development';
  const endpoint = isDevelopment 
    ? 'https://api.self.xyz/v1' // Use Self's demo API for development
    : `${process.env.NEXT_PUBLIC_APP_URL}/api/self/verify`;

  const app = new SelfAppBuilder({
    appName: config.appName,
    header: config.header,
    logoBase64: config.logo,
    endpoint: endpoint,
    endpointType: 'https' as const,
    scope: config.scope,
    sessionId: sessionSeed,
    userId: userId,
    userIdType: 'uuid',
    devMode: true,
    disclosures: {
      minimumAge: config.minimumAge,
      nationality: config.requireNationality,
      gender: config.requireGender,
    },
  }).build();

  const universalLink = `${config.redirectUrl}?selfApp=${encodeURIComponent(
    JSON.stringify({ ...app, sessionId: sessionSeed })
  )}`;

  return {
    app,
    universalLink,
    userAddress: userId,
    websocketUrl: config.websocketUrl,
  };
};

export default function SelfVerificationComponent({
  onVerificationComplete,
  onVerificationError,
  className = '',
}: SelfVerificationComponentProps = {}) {
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const [universalLink, setUniversalLink] = useState<string>('');
  const [userAddress, setUserAddress] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [websocketUrl, setWebsocketUrl] = useState<string>('');

  useEffect(() => {
    try {
      const { app, universalLink, userAddress, websocketUrl } = buildSelfApp();
      setSelfApp(app);
      setUniversalLink(universalLink);
      setUserAddress(userAddress);
      setWebsocketUrl(websocketUrl);
      setViewState('ready');
    } catch (error) {
      console.error('Failed to initialize Self App', error);
      setErrorMessage('Failed to initialize Self verification.');
      setViewState('error');
      onVerificationError?.('Failed to initialize Self verification');
    }
  }, [onVerificationError]);

  const handleSuccess = (data?: Record<string, unknown>) => {
    console.log('Self verification success:', data);
    
    // Create verification data based on current state
    const verificationData: SelfVerificationData = {
      verified: true,
      identity: {
        id: userAddress,
        verified_at: new Date().toISOString(),
        attributes: {
          verification_level: 'high',
          age_over_18: true,
          ...(data || {}),
        },
      },
    };

    setViewState('verified');
    onVerificationComplete?.(verificationData);
  };

  const handleError = (error: unknown) => {
    console.error('Self verification error:', error);
    console.log('Error details:', JSON.stringify(error, null, 2));
    
    let errorMsg = 'Verification failed';
    
    // Type guard for error with reason property
    if (typeof error === 'object' && error !== null && 'reason' in error) {
      const reasonError = error as { reason: string };
      if (reasonError.reason && reasonError.reason.includes('DOCTYPE')) {
        errorMsg = 'Network configuration issue - using fallback';
      }
    }
    
    // Type guard for error with error_code property
    if (typeof error === 'object' && error !== null && 'error_code' in error) {
      const codeError = error as { error_code: string };
      if (codeError.error_code === 'UNKNOWN_ERROR') {
        errorMsg = 'Self service temporarily unavailable';
      }
    }
    
    // Type guard for Error instances
    if (error instanceof Error && error.message) {
      errorMsg = error.message;
    }
    
    setErrorMessage(errorMsg);
    setViewState('error');
    onVerificationError?.(errorMsg);
  };

  const handleRetry = () => {
    try {
      setViewState('loading');
      const { app, universalLink, userAddress, websocketUrl } = buildSelfApp();
      setSelfApp(app);
      setUniversalLink(universalLink);
      setUserAddress(userAddress);
      setWebsocketUrl(websocketUrl);
      setErrorMessage('');
      setViewState('ready');
    } catch (error) {
      console.error('Failed to reset Self verification', error);
      setErrorMessage('Unable to reset verification. Please refresh the page.');
      setViewState('error');
    }
  };

  return (
    <div
      className={`relative flex min-h-[420px] flex-col items-center justify-center overflow-hidden rounded-[28px] p-10 ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(111,78,176,0.22),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,rgba(255,252,244,0.95),rgba(255,107,53,0.08)_45%,rgba(111,78,176,0.12)_100%)]" />
      <div className="relative w-full max-w-md rounded-3xl border border-[#6f4eb0]/15 bg-[#FFFCF4]/95 p-8 shadow-[0_32px_80px_-40px_rgba(22,20,31,0.55)]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#f6f1ff] px-4 py-2 text-sm font-medium text-[#6f4eb0] shadow-inner">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#ff6b35]"></span>
            Secure login powered by Self Protocol
          </div>
          <h2 className="text-2xl font-bold text-black">
            Verify your identity
          </h2>
          <p className="max-w-sm text-sm text-black/70">
            Scan the code with the Self mobile app to complete a privacy-preserving, zero-knowledge identity check. No passwords, no seed phrases.
          </p>
        </div>

        {viewState === 'loading' && (
          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#6f4eb0]"></div>
            <p className="text-sm text-black/50">
              Preparing your secure session…
            </p>
          </div>
        )}

        {viewState === 'ready' && selfApp && (
          <div className="mt-8 space-y-6">
            <div className="flex justify-center">
              <SelfQRcodeWrapper
                selfApp={selfApp}
                onSuccess={handleSuccess}
                onError={handleError}
                websocketUrl={websocketUrl}
                type="websocket"
                size={280}
              />
            </div>
            <div className="space-y-3 text-sm text-black/70">
              <div className="rounded-xl border border-[#6f4eb0]/10 bg-white/70 px-4 py-4">
                <p className="mb-1 font-medium text-black">
                  How it works
                </p>
                <ol className="list-decimal list-inside space-y-1 text-left">
                  <li>Open the Self mobile app</li>
                  <li>Scan the QR code and approve the request</li>
                  <li>Come back—Shinobi unlocks instantly</li>
                </ol>
              </div>
              <button
                type="button"
                onClick={() => window.open(universalLink, '_blank')}
                className="w-full rounded-xl bg-gradient-to-r from-[#6f4eb0] via-[#7f5ae4] to-[#ff6b35] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#6f4eb0]/20 transition hover:brightness-105"
              >
                Open the Self app on this device
              </button>
              <button
                type="button"
                onClick={() => window.open('https://self.xyz', '_blank')}
                className="w-full rounded-xl border border-[#6f4eb0]/25 px-4 py-3 text-sm font-semibold text-[#6f4eb0] transition hover:bg-[#f6f1ff]"
              >
                Need the Self app? Download it →
              </button>
              {process.env.NODE_ENV === 'development' && (
                <button
                  type="button"
                  onClick={() => handleSuccess({ test_mode: true })}
                  className="w-full rounded-xl bg-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-300"
                >
                  🧪 Test Mode: Skip Verification
                </button>
              )}
            </div>
          </div>
        )}

        {viewState === 'verified' && (
          <div className="mt-8 space-y-6">
            <div className="flex flex-col items-center gap-3 text-[#15a34a]">
              <div className="text-5xl">🎉</div>
              <h3 className="text-xl font-semibold">
                Identity verified
              </h3>
              <p className="text-sm text-black/60">
                You&apos;re good to go—your session is now trusted.
              </p>
            </div>
            <div className="rounded-xl border border-[#6f4eb0]/10 bg-[#f6fff6] px-4 py-4 text-left text-sm text-black/70">
              <p className="font-semibold text-[#0f7a35]">
                Session summary
              </p>
              <ul className="mt-2 space-y-1 text-xs">
                <li>
                  <span className="font-medium">Identity:</span> {userAddress.slice(0, 8)}...
                </li>
                <li>
                  <span className="font-medium">Verified at:</span>{' '}
                  {new Date().toLocaleString()}
                </li>
                <li>
                  <span className="font-medium">Verification level:</span> high
                </li>
              </ul>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={handleRetry}
                className="w-full rounded-xl border border-[#6f4eb0]/25 px-4 py-3 text-sm font-semibold text-[#6f4eb0] transition hover:bg-[#f6f1ff]"
              >
                Verify another identity
              </button>
            </div>
          </div>
        )}

        {viewState === 'error' && (
          <div className="mt-8 space-y-6 text-center">
            <div className="text-4xl">⚠️</div>
            <p className="text-sm text-red-500">
              {errorMessage || 'Something went wrong while initializing the verification flow.'}
            </p>
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleRetry}
                className="w-full rounded-xl bg-gradient-to-r from-[#6f4eb0] via-[#7f5ae4] to-[#ff6b35] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#6f4eb0]/20 transition hover:brightness-105"
              >
                Try again
              </button>
              {process.env.NODE_ENV === 'development' && (
                <button
                  type="button"
                  onClick={() => handleSuccess({ bypass: true })}
                  className="w-full rounded-xl bg-green-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-600"
                >
                  🚀 Skip & Continue (Dev Mode)
                </button>
              )}
            </div>
          </div>
        )}

        {viewState !== 'verified' && (
          <p className="mt-8 text-center text-xs uppercase tracking-[0.3em] text-black/40">
            Zero-knowledge · Passwordless · Relayer-free
          </p>
        )}
      </div>
    </div>
  );
}