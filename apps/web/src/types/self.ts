// Self Protocol Types
export interface SelfVerificationRequest {
  endpoint: string;
  appName: string;
  scope: string;
  sessionId: string;
}

export interface SelfVerificationSession {
  sessionId: string;
  status: 'pending' | 'completed' | 'failed' | 'expired';
  createdAt: Date;
  completedAt?: Date;
  qrCodeData: SelfVerificationRequest;
  data?: SelfVerificationData;
  error?: string;
}

export interface SelfVerificationData {
  verified: boolean;
  identity: {
    id: string;
    verified_at: string;
    attributes: {
      age_over_18?: boolean;
      country?: string;
      verification_level?: 'low' | 'medium' | 'high';
      // Additional dynamic attributes from Self protocol or future extensions
      [key: string]: unknown;
    };
  };
}

export interface SelfAPIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CreateVerificationResponse {
  sessionId: string;
  qrCodeUrl: string;
}

export interface CheckVerificationResponse {
  sessionId: string;
  status: SelfVerificationSession['status'];
  data?: SelfVerificationData;
  error?: string;
}

// Component Props
export interface SelfVerificationComponentProps {
  onVerificationComplete?: (data: SelfVerificationData) => void;
  onVerificationError?: (error: string) => void;
  className?: string;
}

// Error Types
export class SelfVerificationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'SelfVerificationError';
  }
}

export const SelfErrorCodes = {
  INITIALIZATION_FAILED: 'INITIALIZATION_FAILED',
  QR_GENERATION_FAILED: 'QR_GENERATION_FAILED',
  VERIFICATION_TIMEOUT: 'VERIFICATION_TIMEOUT',
  VERIFICATION_FAILED: 'VERIFICATION_FAILED',
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  INVALID_PROOF: 'INVALID_PROOF',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;

export type SelfErrorCode = typeof SelfErrorCodes[keyof typeof SelfErrorCodes];