import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { Wallet, ethers } from 'ethers';

import { getSelfFrontendConfig } from '@/config/self';
import { createSession } from '@/lib/self/sessionStore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const requestedAddress: string | undefined = body?.walletAddress;

    const config = getSelfFrontendConfig();

    const walletAddress = requestedAddress
      ? ethers.getAddress(requestedAddress)
      : Wallet.createRandom().address;

    const sessionId = randomUUID();
    const actionId = randomUUID();
    const userIdType: 'uuid' | 'hex' = 'uuid';
    const userId = sessionId;

    await createSession(sessionId, {
      actionId,
      userAddress: walletAddress,
      userId,
      userIdType,
      userDefinedData: actionId,
      policy: {
        minimumAge: config.minimumAge,
        excludedCountries: [],
        ofac: false,
      },
      scope: config.scope,
      endpoint: config.endpoint,
      endpointType: config.endpointType,
      devMode: config.devMode,
    });

    return NextResponse.json({
      success: true,
      session: {
        sessionId,
        actionId,
        userAddress: walletAddress,
        userId,
        userIdType,
        userDefinedData: actionId,
        endpoint: config.endpoint,
        endpointType: config.endpointType,
        scope: config.scope,
        devMode: config.devMode,
        policy: {
          minimumAge: config.minimumAge,
          excludedCountries: [],
          ofac: false,
        },
      },
    });
  } catch (error) {
    console.error('[self][session][POST] Failed to create session', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create Self verification session',
      },
      { status: 500 }
    );
  }
}
