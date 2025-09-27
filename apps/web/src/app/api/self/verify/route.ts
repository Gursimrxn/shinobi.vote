import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import {
  SelfBackendVerifier,
  AllIds,
  InMemoryConfigStore,
  type VerificationConfig,
  type AttestationId,
} from '@selfxyz/core';

import {
  getSession,
  setSession,
  updateSession,
} from '@/lib/self/sessionStore';
import {
  registerIdentityForUser,
  mintVerificationBadge,
  anchorVerificationPost,
} from '@/lib/contracts/client';

interface ProofPayload {
  a: [string, string];
  b: [[string, string], [string, string]];
  c: [string, string];
}

interface VerificationCallbackBody {
  sessionId?: string;
  actionId?: string;
  attestationId?: number;
  proof?: ProofPayload;
  pubSignals?: string[];
  userContextData?: string;
}

function isProofPayload(value: unknown): value is ProofPayload {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as ProofPayload;
  return (
    Array.isArray(candidate.a) &&
    Array.isArray(candidate.b) &&
    Array.isArray(candidate.c) &&
    candidate.a.length === 2 &&
    candidate.b.length === 2 &&
    candidate.b[0]?.length === 2 &&
    candidate.b[1]?.length === 2 &&
    candidate.c.length === 2
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as VerificationCallbackBody;
    const sessionId = body.sessionId;
    const attestationId = body.attestationId;
    const proof = body.proof;
    const pubSignals = body.pubSignals;
    const userContextData = body.userContextData;

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'sessionId is required' },
        { status: 400 }
      );
    }

    if (typeof attestationId !== 'number' || (attestationId !== 1 && attestationId !== 2)) {
      return NextResponse.json(
        { success: false, error: 'attestationId must be 1 or 2' },
        { status: 400 }
      );
    }

    if (!isProofPayload(proof)) {
      return NextResponse.json(
        { success: false, error: 'Invalid proof payload' },
        { status: 400 }
      );
    }

    if (!Array.isArray(pubSignals) || pubSignals.length === 0) {
      return NextResponse.json(
        { success: false, error: 'pubSignals array is required' },
        { status: 400 }
      );
    }

    if (!userContextData || typeof userContextData !== 'string') {
      return NextResponse.json(
        { success: false, error: 'userContextData is required' },
        { status: 400 }
      );
    }

    const session = await getSession(sessionId);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    if (session.status === 'verified') {
      return NextResponse.json({ success: true, message: 'Session already verified' });
    }

    if (body.actionId && body.actionId !== session.actionId) {
      return NextResponse.json(
        { success: false, error: 'Action mismatch' },
        { status: 400 }
      );
    }

    const configStore = new InMemoryConfigStore(async () => session.actionId);

    const verificationConfig: VerificationConfig = {
      minimumAge: session.policy.minimumAge,
      excludedCountries: session.policy.excludedCountries as VerificationConfig['excludedCountries'],
      ofac: session.policy.ofac,
    };

    await configStore.setConfig(session.actionId, verificationConfig);

    const verifier = new SelfBackendVerifier(
      session.scope,
      session.endpoint,
      session.devMode,
      AllIds,
      configStore,
      'hex'
    );

    const verificationResult = await verifier.verify(
      attestationId as AttestationId,
      proof,
      pubSignals,
      userContextData
    );

    const userIdentifier = verificationResult.userData.userIdentifier;
    const commitment = ethers.keccak256(
      userIdentifier.startsWith('0x')
        ? userIdentifier
        : ethers.toUtf8Bytes(userIdentifier)
    );

    const targetAddress = deriveTargetAddress(session.userAddress, commitment);

    const proofHash = ethers.keccak256(
      ethers.toUtf8Bytes(
        JSON.stringify({ proof, pubSignals, userContextData })
      )
    );

    const identityOutcome = await registerIdentityForUser(targetAddress, commitment);

    const badgeTxHash = await mintVerificationBadge(targetAddress);

    const cidHash = ethers.keccak256(
      ethers.toUtf8Bytes(`${sessionId}:${userIdentifier}:${Date.now()}`)
    );
    const metaHash = ethers.keccak256(
      ethers.toUtf8Bytes(JSON.stringify({ sessionId, attestationId }))
    );

    const postTxHash = await anchorVerificationPost(cidHash, metaHash);

    const verificationRecord = {
      attestationId,
      proofHash,
      identityCommitment: commitment,
      transactionHashes: {
        identityAnchor: identityOutcome.txHash,
        badgeMint: badgeTxHash,
        postAnchor: postTxHash,
      },
      timestamp: new Date().toISOString(),
    } as const;

    session.status = 'verified';
    session.userIdentifier = userIdentifier;
    session.verification = verificationRecord;
    session.error = undefined;

    await setSession(session);

    return NextResponse.json({
      success: true,
      session: {
        sessionId,
        status: session.status,
        userAddress: targetAddress,
        verification: verificationRecord,
        alreadyRegistered: identityOutcome.alreadyRegistered,
      },
    });
  } catch (error) {
    console.error('[self][verify][POST] Verification failed', error);

    if (error instanceof Error && 'sessionId' in (error as unknown as Record<string, unknown>)) {
      // no-op placeholder for typed guards
    }

    const sessionId = await extractSessionIdSafely(request);
    if (sessionId) {
      await updateSession(sessionId, (existing) => ({
        ...existing,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown verification error',
      }));
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      },
      { status: 500 }
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
