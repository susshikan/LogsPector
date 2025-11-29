import { kv } from "@vercel/kv";

const DAILY_LIMIT = 3;

function todayKey(ip: string) {
  const d = new Date().toISOString().slice(0, 10); 
  return `seo_limit:${ip}:${d}`;
}

export async function checkSeoLimit(ip: string) {
  const key = todayKey(ip);

  const current = await kv.get<number>(key) || 0;

  if (current >= DAILY_LIMIT) {
    return { allowed: false };
  }

  await kv.set(key, current + 1, {
    ex: 60 * 60 * 24, 
  });

  return { allowed: true, remaining: DAILY_LIMIT - (current + 1) };
}
