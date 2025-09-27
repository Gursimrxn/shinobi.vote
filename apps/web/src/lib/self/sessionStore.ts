import { promises as fs } from 'fs';
import path from 'path';

export type StoredUserIdType = 'uuid' | 'hex';

export interface SelfSession {
  sessionId: string;
  actionId: string;
  status: 'pending' | 'verified' | 'failed';
  userAddress?: string;
  userIdentifier?: string;
  userId?: string;
  userIdType: StoredUserIdType;
  userDefinedData?: string;
  scope: string;
  endpoint: string;
  endpointType?: 'https' | 'staging_https' | 'celo' | 'staging_celo';
  devMode: boolean;
  policy: {
    minimumAge: number;
    excludedCountries: string[];
    ofac: boolean;
  };
  verification?: {
    attestationId: number;
    proofHash: string;
    identityCommitment: string;
    transactionHashes: {
      identityAnchor: string;
      badgeMint: string;
      postAnchor: string;
    };
    timestamp: string;
  };
  error?: string;
  createdAt: string;
  updatedAt?: string;
}

interface SessionParams {
  actionId?: string;
  userAddress?: string;
  userId?: string;
  userIdType?: StoredUserIdType;
  userDefinedData?: string;
  scope: string;
  endpoint: string;
  endpointType?: 'https' | 'staging_https' | 'celo' | 'staging_celo';
  devMode: boolean;
  policy: {
    minimumAge: number;
    excludedCountries?: string[];
    ofac: boolean;
  };
}

const SESSIONS_FILE = path.resolve(process.cwd(), 'self_verification_sessions.json');

async function readSessions(): Promise<Record<string, SelfSession>> {
  try {
    const data = await fs.readFile(SESSIONS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function writeSessions(sessions: Record<string, SelfSession>): Promise<void> {
  await fs.writeFile(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
}

export async function getSession(sessionId: string): Promise<SelfSession | null> {
  const sessions = await readSessions();
  return sessions[sessionId] || null;
}

export async function setSession(session: SelfSession): Promise<void> {
  const sessions = await readSessions();
  sessions[session.sessionId] = {
    ...session,
    updatedAt: new Date().toISOString(),
  };
  await writeSessions(sessions);
}

export async function updateSession(
  sessionId: string,
  updater: (session: SelfSession) => SelfSession
): Promise<void> {
  const sessions = await readSessions();
  const session = sessions[sessionId];
  if (session) {
    sessions[sessionId] = {
      ...updater(session),
      updatedAt: new Date().toISOString(),
    };
    await writeSessions(sessions);
  }
}

export async function createSession(
  sessionId: string,
  params?: Partial<SessionParams>
): Promise<SelfSession> {
  const sessions = await readSessions();

  const generatedActionId = params?.actionId || `action_${sessionId}`;

  const record: SelfSession = {
    sessionId,
    actionId: generatedActionId,
    status: 'pending',
    userAddress: params?.userAddress,
    userId: params?.userId || sessionId,
    userIdType: params?.userIdType || 'uuid',
    userDefinedData: params?.userDefinedData || generatedActionId,
    scope: params?.scope || 'Shinobi-verification',
    endpoint: params?.endpoint || 'https://api.self.xyz/v1',
    endpointType: params?.endpointType,
    devMode: params?.devMode || process.env.NEXT_PUBLIC_SELF_DEV_MODE === 'true',
    policy: {
      minimumAge: params?.policy?.minimumAge || 18,
      excludedCountries: params?.policy?.excludedCountries || [],
      ofac: params?.policy?.ofac || false,
    },
    createdAt: new Date().toISOString(),
  };

  sessions[record.sessionId] = record;
  await writeSessions(sessions);

  return record;
}

export async function listSessions(): Promise<SelfSession[]> {
  const sessions = await readSessions();
  return Object.values(sessions);
}

export async function findSessionByActionId(actionId: string): Promise<SelfSession | null> {
  if (!actionId) {
    return null;
  }

  const sessions = await readSessions();
  return (
    Object.values(sessions).find((session) => session.actionId === actionId) || null
  );
}