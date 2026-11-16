import catalog from './catalog.js';
import { state, alerts, reset, control, select, advance, scenarioSummary, clearCommand, event, now } from './simulator.js';
import { summary, predictions, anomalies, insights, readiness, compare } from './analytics.js';
import { ApiError, emergencySummary, commandState, activate, respond, sendMessage, syncMessages, afterAction, demoState, startDemo, advanceDemo, exitDemo } from './workflows.js';
import { pdf } from './pdf.js';
const json=(value)=>({value});
const download=(value,type,filename)=>({value,type,filename});
const events=(s,url)=>[...s.events].reverse().filter(e=>!url.searchParams.get('event_type')||e.event_type===url.searchParams.get('event_type'));
const legacy=(h)=>({heart_rate:h.heart_rate,oxygen_level:h.oxygen_saturation,sleep_hours:h.sleep_hours,stress_level:h.stress_index,fatigue_index:h.fatigue_index,workload_index:h.workload_index,radiation:h.radiation_dose_rate,timestamp:h.timestamp,data_type:h.data_type});
const entries=(o)=>Object.entries(o).map(([key,value])=>`${key}: ${typeof value==='object'?JSON.stringify(value):value}`);
const missionReport=(s)=>{
  const m=state(s), a=summary(s), r=readiness(s), scenario=catalog.scenarios[s.scenario];
  return download(pdf('ASTROHEALTH | MISSION HEALTH REPORT',[
    'Team EAGLES | NASA Space Apps Challenge 2026',`Generated: ${now()}`,'Astronaut: Alex Morgan | Mission: Mars Exploration',
    `Phase: ${catalog.phases.find(p=>p.id===s.phase).name} | Scenario: ${scenario.name}`,`Mission elapsed: ${s.elapsed_hours} simulated hours | Status: ${s.status}`,
    'Health summary',...entries(m.health),'Units: heart_rate BPM; oxygen_saturation %; sleep_hours hours; stress/fatigue/workload index; radiation_dose_rate mSv/day.',
    'Analytics and readiness',`Data quality: ${a.data_quality}; sample count: ${a.observations}.`,`Readiness demonstration score: ${r.score}/100 (${r.category}).`,
    `Predictions available: ${a.predictions.filter(p=>p.status==='ready').length} of ${a.predictions.length}. Detected anomalies: ${a.anomalies.filter(p=>p.status==='anomaly').length}.`,
    'Alerts',...(a.alerts.length?a.alerts.map(x=>`${x.severity} | ${x.rule} | ${x.timestamp} | acknowledged=${x.acknowledged}`):['No configured demonstration alerts are active.']),
    'Mission assumptions and limitations',scenario.description,...scenario.assumptions,'Simulation values are illustrative model outputs and not validated predictions or medical advice.',
  ]),'application/pdf','astrohealth-mission-health-report.pdf');
};
const afterReport=(s)=>{
  const a=afterAction(s);
  return download(pdf('ASTROHEALTH | EMERGENCY AFTER-ACTION SUMMARY',[
    `Scenario: ${a.scenario?.name||'None activated'}`,`Simulated elapsed time: ${a.elapsed_hours} hours`,`Actions applied: ${a.selected_actions.length}`,`Generated: ${a.generated_at}`,
    'Response actions',...(a.selected_actions.length?a.selected_actions.map(x=>`${x.action_name}: ${x.explanation}`):['No response action was selected.']),
    'Measurements',...Object.keys(s.health).map(k=>`${k}: initial=${a.initial_measurements?.[k]??'unavailable'} | final=${a.final_measurements[k]}`),
    `Generated alerts: ${a.alerts.length} | Recorded mission events: ${a.events.length}`,'Limitations',...a.limitations,
  ]),'application/pdf','astrohealth-emergency-after-action.pdf');
};
// Map is also the contract coverage registry used by tests.
export const routes = new Map();
function route(method,path,handler,options={}) {routes.set(`${method} ${path}`,{handler,...options});}
route('GET','/api/healthcheck',()=>({status:'ok',service:'astrohealth-api'}),{public:true});
route('GET','/api/session',()=>({status:'ready'}),{bootstrap:true});
route('GET','/api/astronaut',()=>({id:1,name:'Alex Morgan',mission:'Mars Exploration',status:'Active'}),{public:true});
route('GET','/api/nasa/evidence',()=>catalog.nasa,{public:true});
route('GET','/api/mission/scenarios',()=>Object.values(catalog.scenarios).map(scenarioSummary),{public:true});
route('GET','/api/mission/phases',()=>catalog.phases,{public:true});
route('GET','/api/health',s=>{const m=state(s);return {astronaut_id:1,heart_rate:m.health.heart_rate,oxygen_level:m.health.oxygen_saturation,radiation:m.health.radiation_dose_rate,sleep_hours:m.health.sleep_hours,stress_level:m.health.stress_index,timestamp:m.last_updated,data_type:'simulated'};});
route('GET','/api/health/live',s=>legacy(state(s).health));
route('GET','/api/health/history',s=>s.history.map(legacy));
route('GET','/api/mission/state',state);
route('GET','/api/mission/history',s=>s.history);
for(const action of ['start','pause','resume']) route('POST',`/api/mission/${action}`,s=>control(s,action));
route('POST','/api/mission/reset',s=>{reset(s);return state(s);});
for(const key of ['scenario','phase','speed']) route('POST',`/api/mission/${key}`,(s,b)=>select(s,key,b[key]),{schema:{[key]:key==='scenario'?Object.keys(catalog.scenarios):key==='phase'?catalog.phases.map(p=>p.id):[1,5,10,50]}});
route('POST','/api/mission/advance',(s,b)=>advance(s,b.ticks),{schema:{ticks:{min:1,max:100,default:1}}});
route('GET','/api/mission/events',(s,b,url)=>events(s,url));
route('GET','/api/mission/readiness',readiness);
route('POST','/api/mission/compare',(s,b)=>{state(s);return compare(b,s.seed);},{schema:{scenario_a:Object.keys(catalog.scenarios),scenario_b:Object.keys(catalog.scenarios),ticks:{min:1,max:100,default:12}},bucket:'comparison'});
route('GET','/api/analytics/summary',summary);
route('GET','/api/analytics/predictions',s=>{state(s);return predictions(s.history);});
route('GET','/api/analytics/anomalies',s=>{state(s);return anomalies(s.history);});
route('GET','/api/alerts',s=>{state(s);return alerts(s);});
route('POST','/api/alerts/{alert_id}/acknowledge',(s,b,url)=>{
  const id=decodeURIComponent(url.pathname.split('/')[3]), a=s.alerts[id];
  if(!a) throw new ApiError(404,'Alert not found');
  a.acknowledged=true;state(s);event(s,'alert_acknowledged',`Alert acknowledged: ${a.rule}.`,a.metric);return a;
});
for(const path of ['/api/insights','/api/analytics/insights']) route('GET',path,insights);
route('GET','/api/digital-twin',s=>{
  const m=state(s), a=alerts(s), high=a.some(a=>a.severity==='HIGH PRIORITY');
  return {astronaut:{id:1,name:'Alex Morgan',mission_role:'Flight specialist',mission:'Mars Exploration'},status:high?'high_priority':a.length?'attention':'nominal',status_explanation:high?'An illustrative environmental threshold is currently active.':a.length?'One or more illustrative trends should be reviewed.':'All illustrative indicators are within configured demonstration ranges.',mission:m,alerts:a,predictions:predictions(s.history),insights:insights(s)};
});
route('GET','/api/command/state',commandState);
route('GET','/api/command/scenarios',()=>Object.values(catalog.emergencies).map(emergencySummary));
route('POST','/api/command/activate',(s,b)=>activate(s,b.scenario_id),{schema:{scenario_id:Object.keys(catalog.emergencies)}});
route('GET','/api/command/actions',s=>s.command.active?emergencySummary(catalog.emergencies[s.command.active]).actions:[]);
route('POST','/api/command/respond',(s,b)=>respond(s,b.action_id),{schema:{action_id:{string:true,min:1,max:80}}});
route('GET','/api/command/events',(s,b,url)=>events(s,url));
route('POST','/api/command/reset',s=>{reset(s);s.command=clearCommand();return commandState(s);});
route('POST','/api/command/messages',(s,b)=>sendMessage(s,b.message),{schema:{message:{string:true,min:1,max:240}}});
route('GET','/api/command/messages',s=>{state(s);syncMessages(s);return s.command.messages;});
route('GET','/api/command/after-action.json',afterAction);
route('GET','/api/command/after-action.pdf',afterReport);
route('GET','/api/reports/mission-health',missionReport,{bucket:'report'});
route('GET','/api/export/telemetry.json',s=>{state(s);return download({metadata:{seed:s.seed,scenario:s.scenario,phase:s.phase,units:'SI/display units documented per field'},telemetry:s.history},'application/json','astrohealth-telemetry.json');});
route('GET','/api/export/events.json',s=>{state(s);return download({metadata:{seed:s.seed,scenario:s.scenario,phase:s.phase},events:[...s.events].reverse(),alerts:alerts(s)},'application/json','astrohealth-events.json');});
route('GET','/api/export/telemetry.csv',s=>{
  const fields=['timestamp',...Object.keys(s.health),'data_type'];
  const safe=v=>{let t=String(v??'');if(/^[=+\-@]/.test(t))t="'"+t;return /[",\r\n]/.test(t)?`"${t.replaceAll('"','""')}"`:t;};
  return download([fields.join(','),...s.history.map(h=>fields.map(k=>safe(h[k])).join(','))].join('\r\n')+'\r\n','text/csv','astrohealth-telemetry.csv');
});
route('GET','/api/demo/state',demoState);
route('POST','/api/demo/start',startDemo);
route('POST','/api/demo/advance',(s,b)=>advanceDemo(s,b.steps),{schema:{steps:{min:-8,max:8,default:1}}});
route('POST','/api/demo/reset',s=>{const snapshot=s.demo.snapshot;s.demo.active=false;const result=startDemo(s);s.demo.snapshot=snapshot;return result;});
route('POST','/api/demo/exit',exitDemo);
route('GET','/api/demo/status',s=>{
  const count=s.history.length;
  const checks=[
    {id:'backend',name:'Cloudflare Pages backend',status:'Ready',detail:'Mission API is responding.',guidance:''},
    {id:'digital_twin_model',name:'Digital Twin GLB model',status:'Ready',detail:'Astronaut model is available.',guidance:''},
    {id:'telemetry',name:'Telemetry history',status:count>=3?'Ready':'Requires Setup',detail:`${count} observations available.`,guidance:count>=3?'':'Start the mission and advance at least three simulated ticks.'},
    {id:'analytics',name:'AI Health Analytics',status:'Ready',detail:'Analytics routes are registered.',guidance:''},
    {id:'reports',name:'Mission report generation',status:'Ready',detail:'PDF report route is registered.',guidance:''},
  ];return {checks,ready:checks.every(c=>c.status==='Ready')};
});
export function resolve(method,path) {
  const exact=routes.get(`${method} ${path}`);if(exact)return exact;
  if(/^\/api\/alerts\/[^/]+\/acknowledge$/.test(path))return routes.get(`${method} /api/alerts/{alert_id}/acknowledge`);
  return null;
}
export function execute(route,s,body,url) {
  const result=route.handler(s,body,url);
  return result&&Object.hasOwn(result,'value')&&result.type?result:json(result);
}
export function validate(schema,input) {
  if(!schema)return {};
  const errors=[], body={};
  if(!input||typeof input!=='object'||Array.isArray(input)) throw new ApiError(422,[{type:'model_attributes_type',loc:['body'],msg:'Input should be a valid dictionary',input}]);
  for(const [key,rule] of Object.entries(schema)) {
    let value=Object.hasOwn(input,key)?input[key]:rule.default;
    // Pydantic's non-strict integer fields accept whole numeric strings and bools.
    if(!Array.isArray(rule)&&!rule.string&&(typeof value==='boolean'||(typeof value==='string'&&/^[+-]?\d+(\.0+)?$/.test(value.trim()))))value=Number(value);
    let type,msg;
    if(value===undefined){type='missing';msg='Field required';}
    else if(Array.isArray(rule)&&!rule.includes(value)){type='literal_error';msg=`Input should be ${rule.map(x=>JSON.stringify(x)).join(', ')}`;}
    else if(!Array.isArray(rule)&&rule.string) {
      if(typeof value!=='string'){type='string_type';msg='Input should be a valid string';}
      else if(value.length<rule.min||value.length>rule.max){type=value.length<rule.min?'string_too_short':'string_too_long';msg=`String should have ${value.length<rule.min?'at least '+rule.min:'at most '+rule.max} characters`;}
    } else if(!Array.isArray(rule)) {
      if(!Number.isInteger(value)){type='int_parsing';msg='Input should be a valid integer';}
      else if(value<rule.min||value>rule.max){type=value<rule.min?'greater_than_equal':'less_than_equal';msg=`Input should be ${value<rule.min?'greater than or equal to '+rule.min:'less than or equal to '+rule.max}`;}
    }
    if(type)errors.push({type,loc:['body',key],msg,input:input[key]??null});else body[key]=value;
  }
  if(errors.length)throw new ApiError(422,errors);return body;
}
