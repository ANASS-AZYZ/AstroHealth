import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { Miniflare } from 'miniflare';

test('compiled Pages Function on workerd with real D1: all reference routes, concurrency and isolate restart',async()=>{
  const directory=mkdtempSync(join(tmpdir(),'astrohealth-workerd-'));
  const options={enableDevRegistry:false,resourcePersistencePath:directory,telemetry:{enabled:false},workers:[{config:{name:'astrohealth-test',compatibilityDate:'2026-11-16',manifest:{mainModule:'index.js',modulesRoot:resolve('.wrangler/build'),modules:{'index.js':{type:'esm',contents:readFileSync('.wrangler/build/index.js','utf8')}}},env:{ASTROHEALTH_DB:{type:'d1',name:'sessions',id:'sessions'}}}}]};
  let mf=new Miniflare(options);
  try {
    const db=await mf.getD1Database('ASTROHEALTH_DB');
    await db.exec(readFileSync(new URL('../migrations/0001_sessions.sql',import.meta.url),'utf8').replaceAll('\n',' '));
    let cookie='';
    const call=async(method,path,body)=>{
      const r=await mf.dispatchFetch('https://astrohealth-eagles.pages.dev'+path,{method,headers:{cookie,'Content-Type':'application/json'},body:body==null?undefined:JSON.stringify(body)});
      if(r.headers.has('set-cookie'))cookie=r.headers.get('set-cookie').split(';')[0];
      return r;
    };
    let r=await call('GET','/api/session');assert.equal(r.status,200,await r.clone().text());
    const fixtures=JSON.parse(readFileSync(new URL('./fixtures/python-contracts.json',import.meta.url)));
    for(const fixture of fixtures){r=await call(fixture.method,fixture.path,fixture.body);assert.equal(r.status,fixture.status,fixture.path+': '+await r.clone().text());}
    const previous=await (await call('GET','/api/mission/state')).json();
    const parallel=await Promise.all(Array.from({length:4},()=>call('POST','/api/mission/advance',{ticks:2})));
    for(const response of parallel)assert.equal(response.status,200,await response.clone().text());
    assert.equal((await (await call('GET','/api/mission/state')).json()).tick,previous.tick+8);
    await mf.dispose();mf=new Miniflare(options);
    assert.equal((await (await call('GET','/api/mission/state')).json()).tick,previous.tick+8);
    for(const path of ['/api/reports/mission-health','/api/command/after-action.pdf','/api/export/telemetry.csv']){
      r=await call('GET',path);assert.equal(r.status,200);assert.ok((await r.arrayBuffer()).byteLength>100);
    }
  } finally {await mf.dispose();rmSync(directory,{recursive:true,force:true});}
});
