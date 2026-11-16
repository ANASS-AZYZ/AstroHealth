import { fresh } from './simulator.js';
import { ApiError } from './workflows.js';
export const COOKIE='astrohealth_session';
export const TTL=3600;
const expired=()=>new ApiError(401,'Session expired. Establish a new AstroHealth session.',{'X-AstroHealth-Session-Expired':'true'});
export function cookieId(request) {
  const value=request.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);
  return value || null;
}
export function cookieHeader(id,request) {
  return `${COOKIE}=${id}; Path=/; Max-Age=${TTL}; HttpOnly; SameSite=Lax${new URL(request.url).protocol==='https:'?'; Secure':''}`;
}
export function database(env) {
  if(!env.ASTROHEALTH_DB) throw new ApiError(503,'Durable session storage is not configured.');
  // first-primary sessions also remain correct if read replication is enabled later.
  return env.ASTROHEALTH_DB.withSession?env.ASTROHEALTH_DB.withSession('first-primary'):env.ASTROHEALTH_DB;
}
export async function rateLimit(db,request,bucket,limit=60) {
  const ip=request.headers.get('CF-Connecting-IP')||'local';
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ip)))).map(b=>b.toString(16).padStart(2,'0')).join('');
  const minute=Math.floor(Date.now()/60000);
  const row=await db.prepare(`INSERT INTO rate_limits (key, window, count) VALUES (?, ?, 1)
    ON CONFLICT(key) DO UPDATE SET window=excluded.window, count=CASE WHEN rate_limits.window=excluded.window THEN rate_limits.count+1 ELSE 1 END
    RETURNING count`).bind(`${bucket}:${hash}`,minute).first();
  if(row.count>limit) throw new ApiError(429,'Rate limit exceeded; retry shortly.',{'Retry-After':'60'});
}
export async function createSession(db,request) {
  await rateLimit(db,request,'session');
  const timestamp=Math.floor(Date.now()/1000);
  await db.prepare('DELETE FROM sessions WHERE id IN (SELECT id FROM sessions WHERE expires_at < ? LIMIT 100)').bind(timestamp).run();
  await db.prepare('DELETE FROM rate_limits WHERE key IN (SELECT key FROM rate_limits WHERE window < ? LIMIT 100)').bind(Math.floor(Date.now()/60000)-2).run();
  const id=Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b=>b.toString(16).padStart(2,'0')).join('');
  const payload=JSON.stringify(fresh());
  const result=await db.prepare('INSERT INTO sessions (id, version, expires_at, payload) SELECT ?, 0, ?, ? WHERE (SELECT COUNT(*) FROM sessions) < 1000').bind(id,timestamp+TTL,payload).run();
  if(result.meta.changes!==1) throw new ApiError(503,'Session capacity is temporarily full.');
  return id;
}
export async function load(db,id) {
  if(!/^[a-f0-9]{64}$/.test(id||'')) return null;
  return db.prepare('SELECT version, expires_at, payload FROM sessions WHERE id = ?').bind(id).first();
}
// Each attempt works on a separate hydrated snapshot. All side effects (including
// state reads that trigger alerts) commit together or are discarded on conflict.
export async function transact(db,id,operation) {
  for(let attempt=0;attempt<8;attempt++) {
    const timestamp=Math.floor(Date.now()/1000), row=await load(db,id);
    if(!row||row.expires_at<timestamp) throw expired();
    const s=JSON.parse(row.payload), result=operation(s), payload=JSON.stringify(s);
    if(new TextEncoder().encode(payload).length>1000000) throw new ApiError(409,'Session history capacity reached. Export your data and reset the mission.');
    const write=await db.prepare('UPDATE sessions SET payload = ?, version = version + 1, expires_at = ? WHERE id = ? AND version = ? AND expires_at >= ?').bind(payload,timestamp+TTL,id,row.version,timestamp).run();
    if(write.meta.changes===1) return result;
  }
  throw new ApiError(409,'Concurrent session updates; retry this request.');
}
