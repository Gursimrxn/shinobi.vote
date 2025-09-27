import { NextRequest, NextResponse } from 'next/server';
import { 
  SelfVerificationSession, 
  SelfAPIResponse, 
  CheckVerificationResponse
} from '@/types/self';

import fs from 'fs';
import path from 'path';

const SESSIONS_FILE = path.resolve(process.cwd(), 'self_sessions.json');

function readSessions(): Record<string, SelfVerificationSession> {
  try {
    const data = fs.readFileSync(SESSIONS_FILE, 'utf8');
    const raw = JSON.parse(data) as Record<string, SelfVerificationSession>;
    // Rehydrate date fields (non-mutating clone not necessary for simple usage)
    Object.values(raw).forEach((s) => {
      const created = s.createdAt as unknown as string | Date | undefined;
      if (created && typeof created === 'string') {
        s.createdAt = new Date(created);
      }
      const completed = s.completedAt as unknown as string | Date | undefined;
      if (completed && typeof completed === 'string') {
        s.completedAt = new Date(completed);
      }
    });
    return raw;
  } catch {
    return {};
  }
}

function writeSessions(sessions: Record<string, SelfVerificationSession>) {
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      const response: SelfAPIResponse = {
        success: false,
        error: 'Session ID is required',
      };
      return NextResponse.json(response, { status: 400 });
    }

  const sessions = readSessions();
  const session = sessions[sessionId];
    
    if (!session) {
      const response: SelfAPIResponse = {
        success: false,
        error: 'Session not found or expired',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Check for session timeout
    const now = new Date();
  const createdAt = session.createdAt instanceof Date ? session.createdAt : new Date(session.createdAt);
  const timeDiff = now.getTime() - createdAt.getTime();
    const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes

    if (timeDiff > SESSION_TIMEOUT) {
      session.status = 'expired';
  delete sessions[sessionId];
  writeSessions(sessions);
      
      const response: SelfAPIResponse<CheckVerificationResponse> = {
        success: false,
        error: 'Verification session expired',
        data: {
          sessionId,
          status: 'expired',
        },
      };
      return NextResponse.json(response, { status: 410 });
    }

    // For demo purposes, simulate successful verification after 15 seconds
    if (timeDiff > 15000 && session.status === 'pending') {
      // Simulate successful verification
      session.status = 'completed';
      session.completedAt = new Date();
      session.data = {
        verified: true,
        identity: {
          id: `user_${Math.random().toString(36).substr(2, 9)}`,
          verified_at: new Date().toISOString(),
          attributes: {
            age_over_18: true,
            country: 'US',
            verification_level: 'high'
          }
        }
      };
      sessions[sessionId] = session;
      writeSessions(sessions);
    }

    const response: SelfAPIResponse<CheckVerificationResponse> = {
      success: true,
      data: {
        sessionId,
        status: session.status,
        data: session.data,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error checking verification:', error);
    
    const response: SelfAPIResponse = {
      success: false,
      error: 'Failed to check verification status',
    };
    
    return NextResponse.json(response, { status: 500 });
  }
}