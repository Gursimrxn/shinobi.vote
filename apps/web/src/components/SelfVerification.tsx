'use client';

import React, { useState, useEffect, useMemo } from 'react';
import SelfQRcodeWrapper, { SelfApp, SelfAppBuilder } from '@selfxyz/qrcode';
import { Wallet } from 'ethers';

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
}

const buildSelfApp = (): BuildResult => {
  const config = getSelfFrontendConfig();
  const wallet = Wallet.createRandom();
  const sessionSeed =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const app = new SelfAppBuilder({
    appName: config.appName,
    header: config.header,
    logoBase64: config.logo,
    endpoint: config.endpoint,
    endpointType: config.endpointType,
    scope: config.scope,
    sessionId: sessionSeed,
    userId: wallet.address,
    userIdType: 'hex',
    devMode: config.devMode,
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
    userAddress: wallet.address,
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

  useEffect(() => {
    try {
      const { app, universalLink, userAddress } = buildSelfApp();
      setSelfApp(app);
      setUniversalLink(universalLink);
      setUserAddress(userAddress);
      setViewState('ready');
    } catch (error) {
      console.error('Failed to initialize Self App', error);
      setErrorMessage('Failed to initialize Self verification.');
      setViewState('error');
      onVerificationError?.('Failed to initialize Self verification');
    }
  }, [onVerificationError]);

  const verificationData: SelfVerificationData | null = useMemo(() => {
    if (viewState !== 'verified' || !userAddress) {
      return null;
    }

    return {
      verified: true,
      identity: {
        id: userAddress,
        verified_at: new Date().toISOString(),
        attributes: {
          verification_level: 'high',
          age_over_18: true,
        },
      },
    };
  }, [viewState, userAddress]);

  useEffect(() => {
    if (verificationData) {
      onVerificationComplete?.(verificationData);
    }
  }, [verificationData, onVerificationComplete]);

  const handleSuccess = () => {
    setViewState('verified');
  };

  const handleRetry = () => {
    try {
      setViewState('loading');
      const { app, universalLink, userAddress } = buildSelfApp();
      setSelfApp(app);
      setUniversalLink(universalLink);
      setUserAddress(userAddress);
      setErrorMessage('');
      setViewState('ready');
    } catch (error) {
      console.error('Failed to reset Self verification', error);
      setErrorMessage('Unable to reset verification. Please refresh the page.');
      setViewState('error');
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-[420px] p-8 ${className}`}>
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100/60 dark:border-white/10">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-900/40 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-200">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
            Secure login powered by Self Protocol
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Verify your identity
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 max-w-sm">
            Scan the code with the Self mobile app to complete a privacy-preserving, zero-knowledge identity check. No passwords, no seed phrases.
          </p>
        </div>

        {viewState === 'loading' && (
          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
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
                size={280}
              />
            </div>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <div className="rounded-lg bg-gray-50 dark:bg-gray-900/40 px-4 py-3">
                <p className="font-medium text-gray-800 dark:text-white mb-1">
                  How it works
                </p>
                <ol className="list-decimal list-inside space-y-1 text-left">
                  <li>Open the Self mobile app</li>
                  <li>Scan the QR code and approve the request</li>
                  <li>Come back—GhostApp unlocks instantly</li>
                </ol>
              </div>
              <button
                type="button"
                onClick={() => window.open(universalLink, '_blank')}
                className="w-full rounded-lg bg-blue-600 text-white px-4 py-3 text-sm font-medium hover:bg-blue-700 transition"
              >
                Open the Self app on this device
              </button>
              <button
                type="button"
                onClick={() => window.open('https://self.xyz', '_blank')}
                className="w-full rounded-lg border border-blue-200 dark:border-blue-800 px-4 py-3 text-sm font-medium text-blue-600 dark:text-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
              >
                Need the Self app? Download it →
              </button>
            </div>
          </div>
        )}

        {viewState === 'verified' && verificationData && (
          <div className="mt-8 space-y-6">
            <div className="flex flex-col items-center gap-3 text-green-600 dark:text-green-400">
              <div className="text-5xl">🎉</div>
              <h3 className="text-xl font-semibold">
                Identity verified
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                You’re good to go—your session is now trusted.
              </p>
            </div>
            <div className="rounded-xl bg-green-50 dark:bg-green-900/20 px-4 py-4 text-sm text-left text-gray-700 dark:text-gray-200">
              <p className="font-semibold text-green-700 dark:text-green-300">
                Session summary
              </p>
              <ul className="mt-2 space-y-1 text-xs">
                <li>
                  <span className="font-medium">Identity:</span> {verificationData.identity.id}
                </li>
                <li>
                  <span className="font-medium">Verified at:</span>{' '}
                  {new Date(verificationData.identity.verified_at).toLocaleString()}
                </li>
                <li>
                  <span className="font-medium">Verification level:</span>{' '}
                  {verificationData.identity.attributes.verification_level}
                </li>
              </ul>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={handleRetry}
                className="w-full rounded-lg border border-blue-200 dark:border-blue-800 px-4 py-3 text-sm font-medium text-blue-600 dark:text-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
              >
                Verify another identity
              </button>
            </div>
          </div>
        )}

        {viewState === 'error' && (
          <div className="mt-8 space-y-6 text-center">
            <div className="text-4xl">⚠️</div>
            <p className="text-sm text-red-500 dark:text-red-400">
              {errorMessage || 'Something went wrong while initializing the verification flow.'}
            </p>
            <button
              type="button"
              onClick={handleRetry}
              className="w-full rounded-lg bg-blue-600 text-white px-4 py-3 text-sm font-medium hover:bg-blue-700 transition"
            >
              Try again
            </button>
          </div>
        )}

        {viewState !== 'verified' && (
          <p className="mt-8 text-center text-xs text-gray-400 dark:text-gray-500">
            Powered by zero-knowledge proofs · No wallet signatures · No passwords
          </p>
        )}
      </div>
    </div>
  );
}