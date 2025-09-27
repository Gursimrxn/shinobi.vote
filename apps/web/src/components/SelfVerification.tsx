'use client';

import React, { useState, useEffect } from 'react';
import { 
  SelfVerificationData, 
  SelfAPIResponse, 
  CreateVerificationResponse,
  CheckVerificationResponse,
  SelfVerificationComponentProps 
} from '@/types/self';

interface VerificationState {
  status: 'idle' | 'initializing' | 'waiting' | 'completed' | 'failed';
  data?: SelfVerificationData;
  error?: string;
  qrCodeUrl?: string;
}

export default function SelfVerificationComponent({
  onVerificationComplete,
  onVerificationError,
  className = '',
}: SelfVerificationComponentProps = {}) {
  const [state, setState] = useState<VerificationState>({ status: 'idle' });
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    initializeSelfVerification();
  }, []);

  const initializeSelfVerification = async () => {
    setState({ status: 'initializing' });
    
    try {
      const response = await fetch('/api/create-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result: SelfAPIResponse<CreateVerificationResponse> = await response.json();
      
      if (result.success && result.data) {
        setState({
          status: 'waiting',
          qrCodeUrl: result.data.qrCodeUrl,
        });
        setSessionId(result.data.sessionId);
        pollForVerification(result.data.sessionId);
      } else {
        const error = result.error || 'Failed to initialize verification';
        setState({
          status: 'failed',
          error,
        });
        onVerificationError?.(error);
      }
    } catch (error) {
      const errorMessage = 'Network error during initialization';
      setState({
        status: 'failed',
        error: errorMessage,
      });
      onVerificationError?.(errorMessage);
    }
  };

  const pollForVerification = async (sessionId: string) => {
    const maxAttempts = 60; // 5 minutes
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        const error = 'Verification timeout - please try again';
        setState({
          status: 'failed',
          error,
        });
        onVerificationError?.(error);
        return;
      }

      try {
        const response = await fetch(`/api/check-verification?sessionId=${sessionId}`);
        const result: SelfAPIResponse<CheckVerificationResponse> = await response.json();

        if (result.success && result.data) {
          if (result.data.status === 'completed' && result.data.data) {
            setState({
              status: 'completed',
              data: result.data.data,
            });
            onVerificationComplete?.(result.data.data);
          } else if (result.data.status === 'failed' || result.data.status === 'expired') {
            const error = result.data.error || 'Verification failed';
            setState({
              status: 'failed',
              error,
            });
            onVerificationError?.(error);
          } else {
            // Still pending, continue polling
            attempts++;
            setTimeout(poll, 3000); // Poll every 3 seconds
          }
        } else {
          const error = result.error || 'Failed to check verification status';
          setState({
            status: 'failed',
            error,
          });
          onVerificationError?.(error);
        }
      } catch (error) {
        const errorMessage = 'Network error while checking verification';
        setState({
          status: 'failed',
          error: errorMessage,
        });
        onVerificationError?.(errorMessage);
      }
    };

    poll();
  };

  const resetVerification = () => {
    setState({ status: 'idle' });
    setSessionId('');
    initializeSelfVerification();
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-[500px] p-8 ${className}`}>
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
          Identity Verification with Self Protocol
        </h2>
        
        {state.status === 'initializing' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">
              Initializing verification...
            </p>
          </div>
        )}

        {state.status === 'waiting' && state.qrCodeUrl && (
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Scan the QR code with your Self wallet to verify your identity
            </p>
            <div className="flex justify-center mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <img 
                src={state.qrCodeUrl} 
                alt="Self Verification QR Code" 
                className="w-56 h-56"
              />
            </div>
            <div className="mb-4">
              <div className="animate-pulse text-sm text-blue-600 dark:text-blue-400">
                Waiting for verification... (Session: {sessionId.slice(-8)})
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Don't have Self wallet? Download it from{' '}
              <a 
                href="https://self.xyz" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 underline"
              >
                self.xyz
              </a>
            </p>
          </div>
        )}

        {state.status === 'completed' && state.data && (
          <div className="text-center">
            <div className="text-green-600 dark:text-green-400">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-lg font-semibold mb-2">Identity Verified!</h3>
              <p className="text-sm mb-4 text-gray-700 dark:text-gray-300">
                Welcome! Your identity has been successfully verified using Self Protocol.
              </p>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-4">
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                  <div><strong>User ID:</strong> {state.data.identity.id}</div>
                  <div><strong>Verified:</strong> {new Date(state.data.identity.verified_at).toLocaleString()}</div>
                  <div><strong>Level:</strong> {state.data.identity.attributes.verification_level}</div>
                  {state.data.identity.attributes.age_over_18 && (
                    <div><strong>Age Verification:</strong> 18+</div>
                  )}
                  {state.data.identity.attributes.country && (
                    <div><strong>Country:</strong> {state.data.identity.attributes.country}</div>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={resetVerification}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Verify Again
            </button>
          </div>
        )}

        {state.status === 'failed' && (
          <div className="text-center">
            <div className="text-red-600 dark:text-red-400">
              <div className="text-4xl mb-4">❌</div>
              <h3 className="text-lg font-semibold mb-2">Verification Failed</h3>
              <p className="text-sm mb-4 text-gray-700 dark:text-gray-300">
                {state.error || 'Unable to verify your identity'}
              </p>
            </div>
            <button
              onClick={resetVerification}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}