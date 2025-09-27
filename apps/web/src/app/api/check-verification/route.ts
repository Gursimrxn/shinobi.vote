import { NextRequest, NextResponse } from 'next/server';
import { 
  SelfVerificationSession, 
  SelfAPIResponse, 
  CheckVerificationResponse,
  SelfVerificationData,
  SelfVerificationError,
  SelfErrorCodes 
} from '@/types/self';

// Simple in-memory storage for demo purposes
// In production, use a proper database
const verificationSessions = new Map<string, SelfVerificationSession>();

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

    const session = verificationSessions.get(sessionId);
    
    if (!session) {
      const response: SelfAPIResponse = {
        success: false,
        error: 'Session not found or expired',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Check for session timeout
    const now = new Date();
    const timeDiff = now.getTime() - session.createdAt.getTime();
    const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes

    if (timeDiff > SESSION_TIMEOUT) {
      session.status = 'expired';
      verificationSessions.delete(sessionId);
      
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
      verificationSessions.set(sessionId, session);
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