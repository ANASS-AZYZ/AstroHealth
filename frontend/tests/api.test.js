import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { handle } from '../functions/_lib/handler.js';
import { routes } from '../functions/_lib/routes.js';
import { fresh, advance, select, control, reset } from '../functions/_lib/simulator.js';
const origin='https://astrohealth-eagles.pages.dev';
const migration=readFileSync(new URL('../migrations/0001_sessions.sql',import.meta.url),'utf8');
export function storage(filename=':memory:') {
  const sql=new DatabaseSync(filename);sql.exec(migration);
  const db={prepare(query){
    return {bind(...args){
      return {
        async first(){return sql.prepare(query).get(...args)||null;},
        async run(){const r=sql.prepare(query).run(...args);return {meta:{changes:Number(r.changes)}};},
      };
    }};
  }};
  return {env:{ASTROHEALTH_DB:db},sql};
}
export function client(env) {
  let cookie='';
  return {get cookie(){return cookie;},set cookie(c){cookie=c;},async call(method,path,body,headers={}) {
    const r=await handle(new Request(origin+path,{method,headers:{cookie,...(body===undefined?{}:{'Content-Type':'application/json'}),...headers},body:body===undefined?undefined:JSON.stringify(body)}),env);
    if(r.headers.has('set-cookie'))cookie=r.headers.get('set-cookie').split(';')[0];
    return r;
  },async json(method,path,body){const r=await this.call(method,path,body);assert.equal(r.status,200,await r.clone().text());return r.json();}};
}
const fixtures=JSON.parse(readFileSync(new URL('./fixtures/python-contracts.json',import.meta.url)));
function normalize(value) {
  if(Array.isArray(value))return value.map(normalize);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([k,v])=>!['timestamp','last_updated','recorded_at','generated_at'].includes(k)&&!(k==='id'&&typeof v==='string'&&/^[a-f0-9-]{36}$/.test(v))).map(([k,v])=>[k,normalize(v)]));
  if(value==='The in-memory history is reset when the backend process restarts.')return 'Session history is stored durably until session expiration; storage quotas apply.';
  return value;
}
test('all 51 Python API routes have implementations before proxy replacement',()=>{
  const inventory=JSON.parse(readFileSync(new URL('../../docs/cloudflare-route-inventory.json',import.meta.url)));
  assert.equal(inventory.length,51);
  for(const route of inventory)for(const method of route.methods)assert.ok(routes.has(`${method} ${route.path}`),`${method} ${route.path}`);
  assert.equal(routes.size,51);
});
test('sequential Python reference contracts match schemas, status, and deterministic values',async()=>{
  const {env,sql}=storage(), c=client(env);await c.json('GET','/api/session');
  for(const fixture of fixtures) {
    const r=await c.call(fixture.method,fixture.path,fixture.body??undefined);assert.equal(r.status,fixture.status,fixture.path);
    const actual=await r.json();
    if(fixture.path==='/api/demo/status'){assert.equal(actual.checks.length,fixture.payload.checks.length);continue;}
    assert.deepEqual(normalize(actual),normalize(fixture.payload),`${fixture.method} ${fixture.path}`);
  }
  sql.close();
});
test('simulator determinism, pause, reset and bounds across every scenario and phase',()=>{
  const catalog=JSON.parse(readFileSync(new URL('./fixtures/python-contracts.json',import.meta.url)));
  const scenarios=catalog.find(c=>c.path==='/api/mission/scenarios').payload;
  const phases=catalog.find(c=>c.path==='/api/mission/phases').payload;
  for(const scenario of scenarios)for(const phase of phases){
    const a=fresh(),b=fresh();
    for(const s of [a,b]){select(s,'scenario',scenario.id);select(s,'phase',phase.id);advance(s,100);}
    assert.deepEqual(a.health,b.health);
    assert.ok(Object.values(a.health).every(Number.isFinite));
    control(a,'pause');advance(a,5);assert.equal(a.tick,100);reset(a);assert.equal(a.health.heart_rate,72);assert.equal(a.tick,0);
  }
});
test('126 Python simulation reference cases: all scenarios and phases with three seeds',()=>{
  const simulations=JSON.parse(readFileSync(new URL('./fixtures/python-simulations.json',import.meta.url)));
  for(const fixture of simulations){
    const s=fresh();reset(s,fixture.seed);select(s,'scenario',fixture.scenario);select(s,'phase',fixture.phase);control(s,'start');advance(s,30);
    const {data_type,...expected}=fixture.health;
    assert.equal(data_type,'simulated');assert.deepEqual(s.health,expected,JSON.stringify(fixture));
  }
});
test('capacity rejection retains the last committed state and allows export/reset',async()=>{
  const {env,sql}=storage(),c=client(env);await c.json('GET','/api/session');
  const row=sql.prepare('SELECT * FROM sessions').get();const s=JSON.parse(row.payload);
  const observation={...s.health,timestamp:new Date().toISOString(),data_type:'simulated'};
  while(JSON.stringify(s).length<980000)s.history.push(...Array.from({length:50},()=>observation));
  const original=JSON.stringify(s);sql.prepare('UPDATE sessions SET payload=?').run(original);
  const response=await c.call('POST','/api/mission/advance',{ticks:100});assert.equal(response.status,409);
  assert.equal(sql.prepare('SELECT payload FROM sessions').get().payload,original);
  assert.equal((await c.call('GET','/api/export/telemetry.json')).status,200);
  await c.json('POST','/api/mission/reset');assert.equal((await c.json('GET','/api/mission/state')).tick,0);
  sql.close();
});
test('sessions survive storage reopen, remain isolated, and concurrent advances lose no ticks',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'astrohealth-')),file=join(dir,'sessions.sqlite');
  let store=storage(file),c=client(store.env);await c.json('GET','/api/session');
  await c.json('POST','/api/mission/advance',{ticks:3});const cookie=c.cookie;store.sql.close();
  store=storage(file);c=client(store.env);c.cookie=cookie;
  assert.equal((await c.json('GET','/api/mission/state')).tick,3);
  const other=client(store.env);assert.equal((await other.json('GET','/api/mission/state')).tick,0);
  const responses=await Promise.all(Array.from({length:5},()=>c.call('POST','/api/mission/advance',{ticks:2})));
  for(const r of responses)assert.equal(r.status,200);
  assert.equal((await c.json('GET','/api/mission/state')).tick,13);
  store.sql.close();rmSync(dir,{recursive:true});
});
test('secure cookies, expiration recovery, fail closed, origin protection, input bounds and rate limits',async()=>{
  const {env,sql}=storage(), c=client(env);
  const r=await c.call('GET','/api/session');assert.match(r.headers.get('set-cookie'),/HttpOnly; SameSite=Lax; Secure/);
  assert.equal((await c.call('POST','/api/mission/start',undefined,{Origin:'https://evil.example'})).status,403);
  for(const ticks of [-1,0,101,1.5,'oops'])assert.equal((await c.call('POST','/api/mission/advance',{ticks})).status,422);
  assert.equal((await c.call('POST','/api/command/respond',{action_id:'invalid'})).status,400);
  assert.equal((await c.call('POST','/api/demo/advance',{steps:1})).status,409);
  assert.equal((await c.call('POST','/api/alerts/missing/acknowledge')).status,404);
  assert.equal((await c.call('GET','/api/mission/start')).status,405);
  assert.equal((await c.call('GET','/api/nope')).status,404);
  sql.exec('UPDATE sessions SET expires_at=0');
  const expired=await c.call('GET','/api/health/live');assert.equal(expired.status,401);assert.equal(expired.headers.get('x-astrohealth-session-expired'),'true');
  await c.json('GET','/api/session?renew=true');assert.equal((await c.json('GET','/api/mission/state')).tick,0);
  assert.equal((await handle(new Request(origin+'/api/mission/state'),{})).status,503);
  for(let i=0;i<61;i++)await c.call('POST','/api/mission/start');
  const limited=await c.call('POST','/api/mission/start');assert.equal(limited.status,429);assert.equal(limited.headers.get('Retry-After'),'60');
  sql.close();
});
test('frontend workflows: telemetry, twin, analytics, alert acknowledgement, messages, demo restore and downloads',async()=>{
  const {env,sql}=storage(), c=client(env);await c.json('GET','/api/session');
  await c.json('POST','/api/mission/advance',{ticks:8});
  const [live,history,twin,analytics]=await Promise.all(['/api/health/live','/api/health/history','/api/digital-twin','/api/analytics/summary'].map(p=>c.json('GET',p)));
  assert.equal(history.length,8);assert.equal(live.heart_rate,twin.mission.health.heart_rate);assert.equal(analytics.data_quality,'good');
  await c.json('POST','/api/command/activate',{scenario_id:'communication_delay'});
  await c.json('POST','/api/command/messages',{message:'status'});
  assert.equal((await c.json('GET','/api/command/messages'))[0].delivered,false);
  await c.json('POST','/api/mission/advance',{ticks:22});
  assert.equal((await c.json('GET','/api/command/messages'))[0].delivered,true);
  const before=await c.json('GET','/api/mission/state');
  const demo=await c.json('POST','/api/demo/start');assert.ok(demo.alert_count>0);
  const alert=(await c.json('GET','/api/alerts'))[0];await c.json('POST',`/api/alerts/${alert.id}/acknowledge`);
  assert.equal((await c.json('GET','/api/alerts'))[0].acknowledged,true);
  await c.json('POST','/api/command/respond',{action_id:'reduce_activity'});
  const exited=await c.json('POST','/api/demo/exit');assert.deepEqual(normalize(exited.mission),normalize(before));
  for(const path of ['/api/reports/mission-health','/api/command/after-action.pdf']){
    const r=await c.call('GET',path);assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),'application/pdf');
    const text=await r.text();assert.ok(text.startsWith('%PDF-1.4'));assert.ok(text.includes('xref'));assert.ok(text.includes('%%EOF'));
  }
  for(const path of ['/api/export/telemetry.csv','/api/export/telemetry.json','/api/export/events.json']){
    const r=await c.call('GET',path);assert.equal(r.status,200);assert.match(r.headers.get('content-disposition'),/attachment/);
  }
  const evidence=await c.json('GET','/api/nasa/evidence');assert.equal(evidence.study.numerical_values_imported,false);
  sql.close();
});
