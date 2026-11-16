import { alerts, now, round, state, fresh, select, control, advance, scenarioSummary } from './simulator.js';
import catalog from './catalog.js';
const definitions={heart_rate:'BPM',oxygen_saturation:'%',fatigue_index:'index (0-100)',stress_index:'index (0-100)',sleep_hours:'hours'};
const mean=(xs)=>xs.reduce((a,b)=>a+b,0)/xs.length;
export function predictions(history) {
  return Object.entries(definitions).map(([metric,unit])=>{
    const values=history.map(h=>h[metric]).filter(Number.isFinite), recent=values.slice(-8), n=recent.length;
    const base={metric,unit,status:'insufficient_data',predicted_value:null,forecast_horizon:'next 3 simulation ticks',method:'linear trend over a moving window',observations:values.length,data_quality:'insufficient',explanation:'At least 3 valid observations are required; no prediction was fabricated.',generated_at:now()};
    if(values.length<3) return base;
    const avg=mean(recent), xmean=(n-1)/2;
    const slope=recent.reduce((sum,v,i)=>sum+(i-xmean)*(v-avg),0)/recent.reduce((sum,_,i)=>sum+(i-xmean)**2,0);
    return {...base,status:'ready',predicted_value:round(recent[n-1]+slope*3),method:`moving average (${n}) + linear trend`,data_quality:values.length>=8?'good':'limited',explanation:`Estimated from the latest ${n} valid observations. This is an experimental statistical trend, not a clinical forecast.`};
  });
}
export function anomalies(history) {
  return Object.keys(definitions).map(metric=>{
    const values=history.map(h=>h[metric]).filter(Number.isFinite);
    const base={metric,status:'insufficient_data',observed_value:null,rolling_mean:null,rolling_std:null,window:8,observations:values.length,explanation:'At least 3 valid observations are required.'};
    if(values.length<3) return base;
    const recent=values.slice(-8), current=recent.at(-1), reference=recent.slice(0,-1), avg=mean(reference), std=Math.sqrt(mean(reference.map(v=>(v-avg)**2)));
    const anomaly=std>=1e-9&&Math.abs(current-avg)/std>=2;
    return {...base,status:anomaly?'anomaly':'normal',observed_value:round(current),rolling_mean:round(avg),rolling_std:round(std),explanation:std<1e-9?'The reference window has near-zero variance; no statistical outlier is asserted.':`The latest value is ${anomaly?'outside':'within'} the rolling statistical range. A statistical anomaly is not a medical diagnosis.`};
  });
}
export function summary(s) {
  const m=state(s);
  return {mission_day:m.mission_day,scenario:m.scenario,phase:m.phase,observations:s.history.length,predictions:predictions(s.history),anomalies:anomalies(s.history),alerts:alerts(s),data_quality:s.history.length>=8?'good':s.history.length>=3?'limited':'insufficient',disclaimer:'Simulated, experimental analytics only; not clinically validated or medical advice.'};
}
export function insights(s) {
  const result=summary(s), ready=result.predictions.filter(p=>p.status==='ready').length;
  return {title:'AstroHealth Insights',summary:`Current scenario: ${s.scenario}. ${ready?`${ready} indicators have enough observations for an experimental short-term trend estimate.`:'More mission ticks are needed before short-term trends can be estimated.'} There are ${result.alerts.filter(a=>!a.acknowledged).length} unacknowledged demonstration alerts and ${result.anomalies.filter(a=>a.status==='anomaly').length} statistical anomalies.`,factors:['Scenario parameters and bounded random variation influence these simulated measurements.','Trend and anomaly results describe data patterns only; they do not diagnose medical conditions.'],limitations:['No clinical model, NASA medical threshold, or validated prediction accuracy is used.','Session history is stored durably until session expiration; storage quotas apply.'],current_indicators:state(s).health,data_type:'simulated_experimental'};
}
export function readiness(s) {
  state(s);
  const inputs={fatigue_index:s.health.fatigue_index,stress_index:s.health.stress_index,sleep_hours:s.health.sleep_hours,workload_index:s.health.workload_index,active_alerts:alerts(s).filter(a=>!a.acknowledged).length};
  const weights={fatigue_index:0.30,stress_index:0.25,sleep_hours:0.20,workload_index:0.15,active_alerts:0.10};
  const penalty=inputs.fatigue_index*0.30+inputs.stress_index*0.25+Math.max(0,Math.min(100,(8-inputs.sleep_hours)*20))*0.20+inputs.workload_index*0.15+Math.min(100,inputs.active_alerts*25)*0.10;
  const score=round(Math.max(0,Math.min(100,100-penalty)),0);
  return {score,category:score>=80?'Nominal':score>=60?'Attention':'Review Required',formula:'100 - (fatigue x 0.30 + stress x 0.25 + sleep deficit x 0.20 + workload x 0.15 + alert penalty x 0.10)',weights,inputs,missing_data_behavior:'Missing indicators contribute zero penalty and are disclosed by the source data quality.',limitations:['Demonstration-only rules, not NASA operational or medical readiness standards.','The score cannot determine whether an astronaut is medically fit for duty.','Inputs are simulated and not clinically validated.']};
}
export function compare(body, seed) {
  const results=[fresh(),fresh()];
  return compareRuns(body,seed,results);
}
import { reset } from './simulator.js';
function compareRuns(body,seed,runs) {
  runs.forEach((s,i)=>{reset(s,seed); select(s,'scenario',i?body.scenario_b:body.scenario_a);control(s,'start');advance(s,body.ticks);});
  const [a,b]=runs.map(s=>s.history.at(-1));
  const units={heart_rate:'BPM',oxygen_saturation:'%',sleep_hours:'hours',stress_index:'index (0-100)',fatigue_index:'index (0-100)',workload_index:'index (0-100)',radiation_dose_rate:'mSv/day'};
  return {scenario_a:scenarioSummary(catalog.scenarios[body.scenario_a]),scenario_b:scenarioSummary(catalog.scenarios[body.scenario_b]),seed,ticks:body.ticks,metrics:Object.entries(units).map(([metric,unit])=>{
    const difference=round(b[metric]-a[metric]);
    return {metric,unit,scenario_a:a[metric],scenario_b:b[metric],absolute_difference:difference,percentage_difference:a[metric]?round(difference/Math.abs(a[metric])*100):null};
  }),series:runs[0].history.map((a,i)=>({tick:i+1,scenario_a:round(a.stress_index),scenario_b:round(runs[1].history[i].stress_index),scenario_a_fatigue:round(a.fatigue_index),scenario_b_fatigue:round(runs[1].history[i].fatigue_index)})),explanation:'Both isolated runs use the same seed, baseline, phase, duration, and time steps. Outputs are illustrative model results, not validated predictions of astronaut physiology.'};
}
