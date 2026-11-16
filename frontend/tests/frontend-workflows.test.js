import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import axios, { AxiosError } from 'axios';
import { DatabaseSync } from 'node:sqlite';
import { handle } from '../functions/_lib/handler.js';

test('actual frontend API client: bootstrap, simulator, charts, command, demo, reports and 401 renewal',async()=>{
  const sql=new DatabaseSync(':memory:');
  sql.exec(readFileSync(new URL('../migrations/0001_sessions.sql',import.meta.url),'utf8'));
  const env={ASTROHEALTH_DB:{prepare(query){return {bind(...args){return {
    async first(){return sql.prepare(query).get(...args)||null;},
    async run(){return {meta:{changes:Number(sql.prepare(query).run(...args).changes)}};},
  };}};}}};
  let cookie=''; const original=axios.defaults.adapter;
  // Browser transport substitute: exercise the unmodified exported client methods
  // and Axios renewal interceptor against the real Pages handler and SQLite.
  axios.defaults.adapter=async config=>{
    const url=new URL(config.url,'https://astrohealth-eagles.pages.dev');
    for(const [k,v] of Object.entries(config.params||{}))url.searchParams.set(k,v);
    const r=await handle(new Request(url,{method:config.method.toUpperCase(),headers:{cookie,...config.headers.toJSON()},body:config.data}),env);
    if(r.headers.has('set-cookie'))cookie=r.headers.get('set-cookie').split(';')[0];
    const response={data:await r.text(),status:r.status,statusText:r.statusText,headers:Object.fromEntries(r.headers),config};
    if(r.status>=400)throw new AxiosError('API error','ERR_BAD_RESPONSE',config,null,response);
    return response;
  };
  try {
    const axiosUrl=new URL('../node_modules/axios/index.js',import.meta.url).href;
    const source=readFileSync(new URL('../src/services/api.js',import.meta.url),'utf8').replace('"axios"',JSON.stringify(axiosUrl)).replaceAll('import.meta.env.DEV','false');
    const api=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
    await api.initializeSession();
    assert.ok(cookie);assert.equal((await api.getMissionState()).status,'running');
    await api.setMissionPhase('mars_surface');await api.setMissionScenario('elevated_workload');await api.setMissionSpeed(5);await api.advanceMission(8);
    await api.pauseMission();await api.advanceMission(5);assert.equal((await api.getMissionState()).tick,8);await api.resumeMission();
    const [live,history,twin,summary]=await Promise.all([api.getLiveHealth(),api.getHealthHistory(),api.getDigitalTwin(),api.getAnalyticsSummary()]);
    assert.equal(history.length,8);assert.equal(twin.mission.health.heart_rate,live.heart_rate);assert.equal(summary.predictions.length,5);
    assert.equal((await api.compareMissionScenarios('nominal','sleep_disruption')).series.length,12);
    await api.activateCommandScenario('elevated_workload');assert.ok((await api.respondToCommandScenario('reduce_activity')).last_consequence);
    await api.sendCommandMessage('hello');assert.equal((await api.getCommandState()).messages.length,1);
    const before=await api.getMissionState();await api.startDemo();await api.advanceDemo();
    const alert=(await api.getAlerts())[0];assert.equal((await api.acknowledgeAlert(alert.id)).acknowledged,true);
    assert.ok((await api.getDemoStatus()).ready);await api.resetDemo();await api.exitDemo();assert.equal((await api.getMissionState()).tick,before.tick);
    for(const url of [api.missionHealthReportUrl(),api.commandDownloadUrl('after-action.pdf'),api.intelligenceDownloadUrl('telemetry.csv')]){
      const response=await handle(new Request(new URL(url,'https://astrohealth-eagles.pages.dev'),{headers:{cookie}}),env);assert.equal(response.status,200);
    }
    sql.exec('UPDATE sessions SET expires_at=0');
    assert.equal((await api.getMissionState()).tick,0,'401 interceptor renews the expired session and retries');
    assert.equal((await api.getNASAEvidence()).study.numerical_values_imported,false);
  } finally {axios.defaults.adapter=original;sql.close();}
});
