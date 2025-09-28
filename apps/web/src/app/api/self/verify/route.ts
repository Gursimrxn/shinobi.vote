import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { SelfBackendVerifier, DefaultConfigStore, AllIds } from '@selfxyz/core';

import {
  getSession,
  setSession,
  updateSession,
  createSession,
} from '@/lib/self/sessionStore';

import {
  registerIdentityForUser,
  mintVerificationBadge,
  anchorVerificationPost,
} from '@/lib/contracts/client';

// Initialize SelfBackendVerifier
const SCOPE = process.env.NEXT_PUBLIC_SELF_SCOPE || 'Shinobi-verification';
const ENDPOINT = process.env.NEXT_PUBLIC_SELF_ENDPOINT || 'https://api.self.xyz/v1';
const MOCK_PASSPORT = process.env.NEXT_PUBLIC_SELF_DEV_MODE === 'true';
const ALLOWED_IDS = AllIds;
const CONFIG = {
  minimumAge: 18,
  excludedCountries: [],
  ofac: false,
};
const configStorage = new DefaultConfigStore(CONFIG);
const USER_IDENTIFIER_TYPE = 'uuid';

const verifier = new SelfBackendVerifier(
  SCOPE,
  ENDPOINT,
  MOCK_PASSPORT,
  ALLOWED_IDS,
  configStorage,
  USER_IDENTIFIER_TYPE
);

interface VerificationCallbackBody {
  sessionId?: string;
  actionId?: string;
  attestationId?: number;
  proof?: Record<string, unknown>;
  pubSignals?: string[];
  userContextData?: string;
  // Additional fields that Self Protocol might send
  userIdentifier?: string;
  verified?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as VerificationCallbackBody;
    console.log('[self][verify] Received verification callback:', body);

    const sessionId = body.sessionId;

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'sessionId is required' },
        { status: 400 }
      );
    }

    // Get or create session
    let session = await getSession(sessionId);
    
    if (!session) {
      // Create a new session if it doesn't exist
      session = await createSession(sessionId);
    }

    if (session.status === 'verified') {
      return NextResponse.json({ 
        success: true, 
        message: 'Session already verified',
        verified: true 
      });
    }

    // Verify proof using SelfBackendVerifier
    if (!body.attestationId || !body.proof || !body.pubSignals || !body.userContextData) {
      return NextResponse.json(
        { success: false, error: 'Missing required verification fields' },
        { status: 400 }
      );
    }

    const verificationResult = await verifier.verify(
      body.attestationId as 1 | 2,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      body.proof as any,
      body.pubSignals,
      body.userContextData
    );

    if (!verificationResult.isValidDetails.isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid verification proof' },
        { status: 400 }
      );
    }

    const userIdentifier = verificationResult.userData.userIdentifier;
    const commitment = ethers.keccak256(
      ethers.toUtf8Bytes(userIdentifier)
    );

    // Derive user address from commitment
    const targetAddress = deriveTargetAddress(session.userAddress, commitment);

    // Register identity with blockchain
    const identityOutcome = await registerIdentityForUser(targetAddress, commitment);
    
    // Mint a verification badge
    const badgeTxHash = await mintVerificationBadge(targetAddress);

    // Anchor verification post to blockchain
    const cidHash = ethers.keccak256(
      ethers.toUtf8Bytes(`${sessionId}:${userIdentifier}:${Date.now()}`)
    );
    const metaHash = ethers.keccak256(
      ethers.toUtf8Bytes(JSON.stringify({ sessionId, attestationId: body.attestationId }))
    );

    const postTxHash = await anchorVerificationPost(cidHash, metaHash);

    const verificationRecord = {
      attestationId: verificationResult.attestationId,
      proofHash: verificationResult.discloseOutput.nullifier,
      identityCommitment: commitment,
      selfVerificationData: {
        nullifier: verificationResult.discloseOutput.nullifier,
        issuingState: verificationResult.discloseOutput.issuingState,
        nationality: verificationResult.discloseOutput.nationality,
        minimumAge: verificationResult.discloseOutput.minimumAge,
        isValidDetails: verificationResult.isValidDetails,
      },
      transactionHashes: {
        identityAnchor: identityOutcome.txHash,
        badgeMint: badgeTxHash || '0x' + '0'.repeat(64),
        postAnchor: postTxHash || '0x' + '0'.repeat(64),
      },
      timestamp: new Date().toISOString(),
    };

    session.status = 'verified';
    session.userIdentifier = userIdentifier;
    session.verification = verificationRecord;
    session.error = undefined;

    await setSession(session);

    console.log('[self][verify] Session verified successfully:', sessionId);

    return NextResponse.json({
      success: true,
      verified: true,
      session: {
        sessionId,
        status: session.status,
        userAddress: targetAddress,
        verification: verificationRecord,
        alreadyRegistered: identityOutcome.alreadyRegistered,
      },
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'ngrok-skip-browser-warning': 'true',
      },
    });
  } catch (error: unknown) {
    console.error('[self][verify][POST] Verification failed', error);

    const sessionId = await extractSessionIdSafely(request);
    if (sessionId) {
      await updateSession(sessionId, (existing) => ({
        ...existing,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown verification error',
      }));
    }

    // Handle SelfBackendVerifier specific errors
    if (error instanceof Error && error.name === 'ConfigMismatchError') {
      const configError = error as Error & { issues?: unknown };
      return NextResponse.json(
        {
          success: false,
          error: 'Configuration validation failed',
          details: configError.issues,
        },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'ngrok-skip-browser-warning': 'true',
          },
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'ngrok-skip-browser-warning': 'true',
        },
      }
    );
  }
}

async function extractSessionIdSafely(request: NextRequest): Promise<string | undefined> {
  try {
    const cloned = request.clone();
    const body = (await cloned.json()) as VerificationCallbackBody;
    if (body && typeof body.sessionId === 'string') {
      return body.sessionId;
    }
  } catch (error) {
    console.error('[self][verify] Failed to extract session id during error handling', error);
  }
  return undefined;
}

function deriveTargetAddress(userAddress: string | undefined, commitment: string): string {
  if (userAddress) {
    try {
      return ethers.getAddress(userAddress);
    } catch (error) {
      console.warn('[self][verify] Invalid stored user address, deriving from commitment', error);
    }
  }

  const bytes = ethers.getBytes(commitment);
  const lastTwenty = bytes.slice(byteLengthSafe(bytes.length - 20));
  const hexAddress = ethers.hexlify(lastTwenty);
  return ethers.getAddress(hexAddress);
}

function byteLengthSafe(startIndex: number): number {
  return startIndex >= 0 ? startIndex : 0;
}

// Add OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, ngrok-skip-browser-warning',
      'ngrok-skip-browser-warning': 'true',
    },
  });
}
