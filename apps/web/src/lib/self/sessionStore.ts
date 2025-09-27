import { promises as fs } from 'fs';
import path from 'path';

export type SessionStatus = 'pending' | 'verified' | 'failed';

export interface StoredSession {
  sessionId: string;
  actionId: string;
  createdAt: string;
  status: SessionStatus;
  userAddress?: string;
  userIdentifier?: string;
  userDefinedData?: string;
  scope: string;
  endpoint: string;
  devMode: boolean;
  verification?: {
    attestationId: number;
    proofHash: string;
    identityCommitment: string;
    transactionHashes: {
      identityAnchor?: string;
      badgeMint?: string;
      postAnchor?: string;
    };
    timestamp: string;
  };
  error?: string;
  policy: {
    minimumAge?: number;
    excludedCountries: string[];
    ofac: boolean;
  };
}

const DATA_DIR = path.join(process.cwd(), 'var');
const SESSIONS_FILE = path.join(DATA_DIR, 'self-sessions.json');

type SessionDictionary = Record<string, StoredSession>;

async function ensureStorage(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Failed to ensure storage directory', message);
    throw error;
  }

  try {
    await fs.access(SESSIONS_FILE);
  } catch {
    await fs.writeFile(SESSIONS_FILE, JSON.stringify({}, null, 2), 'utf8');
  }
}

async function readSessions(): Promise<SessionDictionary> {
  await ensureStorage();
  try {
    const raw = await fs.readFile(SESSIONS_FILE, 'utf8');
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as SessionDictionary;
    return parsed;
  } catch (error) {
    console.error('Failed to read session storage', error);
    return {};
  }
}

async function writeSessions(sessions: SessionDictionary): Promise<void> {
  await ensureStorage();
  await fs.writeFile(SESSIONS_FILE, JSON.stringify(sessions, null, 2), 'utf8');
}

export async function createSession(params: {
  sessionId: string;
  actionId: string;
  userAddress?: string;
  policy: StoredSession['policy'];
  scope: string;
  endpoint: string;
  devMode: boolean;
}): Promise<StoredSession> {
  const sessions = await readSessions();

  const record: StoredSession = {
    sessionId: params.sessionId,
    actionId: params.actionId,
    createdAt: new Date().toISOString(),
    status: 'pending',
    userAddress: params.userAddress,
    scope: params.scope,
    endpoint: params.endpoint,
    devMode: params.devMode,
    policy: {
      minimumAge: params.policy.minimumAge,
      excludedCountries: params.policy.excludedCountries ?? [],
      ofac: params.policy.ofac,
    },
  };

  sessions[record.sessionId] = record;
  await writeSessions(sessions);

  return record;
}

export async function getSession(sessionId: string): Promise<StoredSession | undefined> {
  const sessions = await readSessions();
  return sessions[sessionId];
}

export async function setSession(session: StoredSession): Promise<void> {
  const sessions = await readSessions();
  sessions[session.sessionId] = session;
  await writeSessions(sessions);
}

export async function updateSession(
  sessionId: string,
  updater: (session: StoredSession) => StoredSession
): Promise<StoredSession | undefined> {
  const sessions = await readSessions();
  const existing = sessions[sessionId];

  if (!existing) {
    return undefined;
  }

  const updated = updater(existing);
  sessions[sessionId] = updated;
  await writeSessions(sessions);
  return updated;
}

export async function listSessions(): Promise<StoredSession[]> {
  const sessions = await readSessions();
  return Object.values(sessions);
}
