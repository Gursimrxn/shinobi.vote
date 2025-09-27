import { NextRequest, NextResponse } from 'next/server';
import { 
  SelfVerificationSession, 
  SelfAPIResponse, 
  CreateVerificationResponse,
  SelfVerificationError,
  SelfErrorCodes 
} from '@/types/self';

// Simple in-memory storage for demo purposes
// In production, use a proper database with TTL
const verificationSessions = new Map<string, SelfVerificationSession>();

// Cleanup expired sessions periodically
const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes

setInterval(() => {
  const now = new Date();
  for (const [sessionId, session] of verificationSessions.entries()) {
    const timeDiff = now.getTime() - session.createdAt.getTime();
    if (timeDiff > SESSION_TIMEOUT) {
      verificationSessions.delete(sessionId);
    }
  }
}, 60 * 1000); // Clean up every minute

export async function POST(request: NextRequest) {
  try {
    const sessionId = `self_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Validate environment variables
    const endpoint = process.env.NEXT_PUBLIC_SELF_ENDPOINT;
    const appName = process.env.NEXT_PUBLIC_SELF_APP_NAME;
    const scope = process.env.NEXT_PUBLIC_SELF_SCOPE;

    if (!endpoint || !appName || !scope) {
      throw new SelfVerificationError(
        'Missing required environment variables',
        SelfErrorCodes.INITIALIZATION_FAILED,
        { endpoint: !!endpoint, appName: !!appName, scope: !!scope }
      );
    }

    // Initialize verification session
    const session: SelfVerificationSession = {
      sessionId,
      status: 'pending',
      createdAt: new Date(),
      qrCodeData: {
        endpoint,
        appName,
        scope,
        sessionId,
      }
    };

    verificationSessions.set(sessionId, session);

    // Generate QR code URL
    const qrCodeUrl = await generateQRCodeUrl(session.qrCodeData);

    const response: SelfAPIResponse<CreateVerificationResponse> = {
      success: true,
      data: {
        sessionId,
        qrCodeUrl,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error creating verification:', error);
    
    let errorMessage = 'Failed to create verification session';

    if (error instanceof SelfVerificationError) {
      errorMessage = error.message;
    }

    const response: SelfAPIResponse = {
      success: false,
      error: errorMessage,
    };

    return NextResponse.json(response, { status: 500 });
  }
}

async function generateQRCodeUrl(qrData: any): Promise<string> {
  try {
    const qrCodeSvg = `
      <svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="qrPattern" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
            <rect width="5" height="5" fill="black"/>
            <rect x="5" y="5" width="5" height="5" fill="black"/>
          </pattern>
        </defs>
        <rect width="300" height="300" fill="white" stroke="black" stroke-width="2"/>
        <rect x="20" y="20" width="260" height="260" fill="url(#qrPattern)"/>
        <rect x="50" y="50" width="200" height="200" fill="white"/>
        <text x="150" y="130" text-anchor="middle" fill="black" font-family="Arial" font-size="16" font-weight="bold">
          Self Protocol
        </text>
        <text x="150" y="150" text-anchor="middle" fill="black" font-family="Arial" font-size="12">
          Identity Verification
        </text>
        <text x="150" y="180" text-anchor="middle" fill="gray" font-family="monospace" font-size="10">
          Session: ${qrData.sessionId.slice(-8)}
        </text>
        <text x="150" y="200" text-anchor="middle" fill="gray" font-family="Arial" font-size="10">
          Scan with Self Wallet
        </text>
      </svg>
    `;

    return `data:image/svg+xml,${encodeURIComponent(qrCodeSvg)}`;
  } catch (error) {
    throw new SelfVerificationError(
      'Failed to generate QR code',
      SelfErrorCodes.QR_GENERATION_FAILED,
      error
    );
  }
}