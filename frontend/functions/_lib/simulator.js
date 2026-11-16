import catalog from './catalog.js';
import { PythonRandom } from './random.js';
export const now = () => new Date().toISOString();
export const copy = (x) => structuredClone(x);
// Round ties to even, as Python does, including the binary floating-point input.
export function round(x, digits = 2) {
  const factor = 10 ** digits, value = x * factor, floor = Math.floor(value);
  return (value - floor === 0.5 ? floor + (floor % 2) : Math.round(value)) / factor;
}
export const limits = {heart_rate:[40,180],oxygen_saturation:[80,100],sleep_hours:[0,14],stress_index:[0,100],fatigue_index:[0,100],workload_index:[0,100],radiation_dose_rate:[0,5]};
export const baseline = () => ({heart_rate:72,oxygen_saturation:98,sleep_hours:7.5,stress_index:20,fatigue_index:18,workload_index:25,radiation_dose_rate:0.12});
export const scenarioSummary = (s) => ({id:s.id,name:s.name,description:s.description,active_phases:s.active_phases,environmental_conditions:s.conditions,expected_effects:s.expected_effects,assumptions:s.assumptions});
export function reset(s, seed = s.seed ?? 2026) {
  Object.assign(s,{seed,rng:new PythonRandom(seed).save(),status:'idle',phase:'pre_launch',scenario:'nominal',speed:1,tick:0,elapsed_hours:0,health:baseline(),history:[],alerts:{},recorded:[],events:[]});
  event(s,'simulation_reset','Simulation reset to baseline.');
}
export function fresh() {
  const s = { command:clearCommand(), demo:{active:false,step:0,snapshot:null} };
  reset(s); s.events=[]; control(s,'start'); return s;
}
export const clearCommand = () => ({active:null,initial:null,actions:[],last:null,messages:[]});
export function event(s,event_type,description,metric=null) {
  s.events.push({id:crypto.randomUUID(),event_type,description,mission_timestamp:s.elapsed_hours,recorded_at:now(),scenario:s.scenario,metric});
}
export const measurement = (s) => ({...s.health,timestamp:now(),data_type:'simulated'});
export function alerts(s) {
  for (const [id,metric,unit,rule,threshold,severity,suggested_follow_up] of catalog.alertRules) {
    const value = s.health[metric];
    if ((['heart_rate_low','oxygen_low'].includes(id) ? value <= threshold : value >= threshold) && !s.alerts[id])
      s.alerts[id]={id,metric,observed_value:round(value),unit,rule,threshold,severity,timestamp:now(),explanation:`${rule}. Thresholds are configurable demonstrations, not NASA medical standards.`,suggested_follow_up,acknowledged:false};
  }
  return Object.values(s.alerts);
}
export function simpleAlerts(s) {
  return [
    ['stress_index',70,'attention','Stress index','Review the simulated stress trend and recent mission events.'],
    ['fatigue_index',75,'attention','Fatigue index','Review recent sleep and workload assumptions.'],
    ['radiation_dose_rate',0.35,'high_priority','Environmental dose rate','Review the illustrative environmental exposure indicator.'],
  ].filter(([key,threshold])=>s.health[key]>=threshold).map(([key,threshold,category,metric,message])=>({category,metric,value:s.health[key],threshold,message}));
}
export function state(s) {
  for (const a of alerts(s)) if (!s.recorded.includes(a.id)) { event(s,'alert_triggered',a.rule,a.metric); s.recorded.push(a.id); }
  const health=measurement(s);
  return {status:s.status,phase:s.phase,scenario:s.scenario,speed:s.speed,seed:s.seed,tick:s.tick,elapsed_hours:s.elapsed_hours,mission_day:round(s.elapsed_hours/24),active_stressors:catalog.scenarios[s.scenario].conditions,environmental_conditions:catalog.phases.find(p=>p.id===s.phase).description.split('.'),health,alerts:simpleAlerts(s),last_updated:health.timestamp};
}
export function control(s,action) {
  const status = {start:'running',pause:'paused',resume:'running'};
  s.status=status[action]; event(s,`simulation_${{start:'started',pause:'paused',resume:'resumed'}[action]}`,`Simulation ${{start:'started',pause:'paused',resume:'resumed'}[action]}.`);
  return state(s);
}
export function select(s,key,value) {
  if(s[key]!==value) {
    s[key]=value;
    const texts={scenario:['scenario_selected',`Scenario changed to ${value}.`],phase:['mission_phase_changed',`Mission phase changed to ${value}.`],speed:['simulation_speed_changed',`Simulation speed changed to ${value}x.`]};
    event(s,...texts[key]);
  }
  return state(s);
}
function clamp(s,key,value) { const [lo,hi]=limits[key]; s.health[key]=round(Math.max(lo,Math.min(hi,value))); }
export function advance(s,ticks) {
  if(s.status!=='running') return state(s);
  const e=catalog.scenarios[s.scenario].effects;
  const p=({launch:{heart_rate:5,workload:15},mars_arrival:{stress:5,workload:8},mars_surface:{workload:5},earth_return:{stress:4,fatigue:-5}})[s.phase]||{};
  const rng=new PythonRandom(s.seed,s.rng), h=s.health;
  for(let i=0;i<ticks;i++) {
    clamp(s,'heart_rate',h.heart_rate+((e.heart_rate||0)+(p.heart_rate||0))*0.18+rng.uniform(-2,2));
    clamp(s,'oxygen_saturation',h.oxygen_saturation+rng.uniform(-0.15,0.15));
    clamp(s,'sleep_hours',h.sleep_hours+(e.sleep||0)*0.04+rng.uniform(-0.08,0.08));
    clamp(s,'stress_index',h.stress_index+(e.stress||0)*0.025+(p.stress||0)*0.025+rng.uniform(-1,1));
    clamp(s,'fatigue_index',h.fatigue_index+(e.fatigue||0)*0.035+(p.fatigue||0)*0.035+rng.uniform(-1,1));
    clamp(s,'workload_index',h.workload_index+((e.workload||0)+(p.workload||0))*0.08+rng.uniform(-2,2));
    clamp(s,'radiation_dose_rate',h.radiation_dose_rate+(e.radiation||0)*0.03+rng.uniform(-0.008,0.008));
    s.tick++; s.elapsed_hours++; s.history.push(measurement(s));
  }
  s.rng=rng.save(); return state(s);
}
export function applyEffects(s,effects) {
  for(const [key,delta] of Object.entries(effects)) if(limits[key]) clamp(s,key,s.health[key]+delta);
  s.tick++; s.elapsed_hours++; s.history.push(measurement(s)); return state(s);
}
