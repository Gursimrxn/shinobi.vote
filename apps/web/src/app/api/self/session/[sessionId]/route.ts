import { NextRequest, NextResponse } from 'next/server';

import { getSession } from '@/lib/self/sessionStore';

interface RouteParams {
  params: {
    sessionId: string;
  };
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = params;

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session ID is required',
        },
        { status: 400 }
      );
    }

    const session = await getSession(sessionId);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      session: {
        sessionId: session.sessionId,
        status: session.status,
        userAddress: session.userAddress,
        verification: session.verification,
        error: session.error,
      },
    });
  } catch (error) {
    console.error('[self][session][GET] Failed to fetch session', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Unable to fetch Self verification session',
      },
      { status: 500 }
    );
  }
}
