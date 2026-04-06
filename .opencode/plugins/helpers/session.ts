let primarySessionId: string | null = null;
const knownSessions = new Set<string>();

export function isPrimarySession(sessionId: string): boolean {
  if (!primarySessionId) {
    primarySessionId = sessionId;
    knownSessions.add(sessionId);
    return true;
  }

  if (knownSessions.has(sessionId)) {
    return sessionId === primarySessionId;
  }

  knownSessions.add(sessionId);
  return false;
}

export function getPrimarySessionId(): string | null {
  return primarySessionId;
}

export function resetSessionTracking(): void {
  primarySessionId = null;
  knownSessions.clear();
}
