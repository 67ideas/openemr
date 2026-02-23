import type { ModelMessage } from "ai";

const sessions = new Map<string, ModelMessage[]>();

export function getHistory(sessionId: string): ModelMessage[] {
  return sessions.get(sessionId) ?? [];
}

export function appendMessage(sessionId: string, msg: ModelMessage): void {
  const history = sessions.get(sessionId) ?? [];
  history.push(msg);
  sessions.set(sessionId, history);
}

export function clearSession(sessionId: string): void {
  sessions.delete(sessionId);
}

export function sessionExists(sessionId: string): boolean {
  return sessions.has(sessionId);
}
