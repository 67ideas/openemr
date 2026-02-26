import type { ModelMessage } from "ai";
import { Redis } from "ioredis";

const TTL_SECONDS = 60 * 60 * 24; // 24 hours

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!process.env.REDIS_URL) return null;
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL, { lazyConnect: false });
    redis.on("error", (err: Error) => console.error("Redis error:", err.message));
  }
  return redis;
}

function key(sessionId: string): string {
  return `conv:${sessionId}`;
}

export async function getHistory(sessionId: string): Promise<ModelMessage[]> {
  const r = getRedis();
  if (!r) return [];
  try {
    const raw = await r.get(key(sessionId));
    return raw ? (JSON.parse(raw) as ModelMessage[]) : [];
  } catch {
    return [];
  }
}

export async function appendMessage(sessionId: string, msg: ModelMessage): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    const history = await getHistory(sessionId);
    history.push(msg);
    await r.set(key(sessionId), JSON.stringify(history), "EX", TTL_SECONDS);
  } catch (err) {
    console.error("Failed to persist message to Redis:", err);
  }
}

export async function clearSession(sessionId: string): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.del(key(sessionId));
  } catch { /* non-fatal */ }
}

export async function sessionExists(sessionId: string): Promise<boolean> {
  const r = getRedis();
  if (!r) return false;
  try {
    return (await r.exists(key(sessionId))) === 1;
  } catch {
    return false;
  }
}
