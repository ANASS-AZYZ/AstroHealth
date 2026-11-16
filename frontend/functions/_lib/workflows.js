import catalog from './catalog.js';
import { state, measurement, event, applyEffects, round, reset, clearCommand, copy, control, select, advance, alerts, now } from './simulator.js';
export class ApiError extends Error {
  constructor(status,detail,headers={}) {super(typeof detail==='string'?detail:'Invalid request');this.status=status;this.detail=detail;this.headers=headers;}
}
export const emergencySummary=(e)=>({...e,actions:e.actions.map(a=>({id:a.id,name:a.name,description:a.description,explanation:a.explanation}))});
export function syncMessages(s) {
  for(const m of s.command.messages) if(!m.delivered&&s.elapsed_hours>=m.delivery_at_mission_hour) {
    m.delivered=true;m.delivered_at_mission_hour=s.elapsed_hours;event(s,'communication_message_delivered','Demonstration message delivered.');
  }
}
export function commandState(s) {
  state(s);syncMessages(s);
  return {mission:state(s),active_scenario:s.command.active?emergencySummary(catalog.emergencies[s.command.active]):null,initial_measurements:s.command.initial,selected_actions:s.command.actions,last_consequence:s.command.last,messages:s.command.messages};
}
export function activate(s,id) {
  const e=catalog.emergencies[id]; state(s);
  Object.assign(s.command,{active:id,initial:measurement(s),actions:[],last:null});
  event(s,'emergency_scenario_activated',`Emergency scenario activated: ${e.name}.`);return commandState(s);
}
export function sendMessage(s,text) {
  state(s);
  const delay=catalog.emergencies[s.command.active]?.parameters.one_way_delay_hours??2;
  const m={id:crypto.randomUUID(),text,sender:'earth_mission_control',sent_at_mission_hour:s.elapsed_hours,delivery_at_mission_hour:s.elapsed_hours+delay,delivered:false,delivered_at_mission_hour:null};
  s.command.messages.push(m);event(s,'communication_message_sent',`Message queued with ${delay}h one-way delay.`);return m;
}
export function respond(s,id) {
  if(!s.command.active) throw new ApiError(400,'Activate an emergency scenario before selecting a response.');
  const action=catalog.emergencies[s.command.active].actions.find(a=>a.id===id);
  if(!action) throw new ApiError(400,'Action is not available for the active scenario.');
  const before=state(s).health, after=applyEffects(s,action.effects).health;
  const record={action_id:action.id,action_name:action.name,description:action.description,explanation:action.explanation,before,after,changed:Object.fromEntries(Object.keys(action.effects).map(k=>[k,round(after[k]-before[k])]))};
  s.command.actions.push(record);s.command.last=record;
  event(s,'emergency_response_applied',`${action.name} applied: ${action.explanation}`);
  if(['send_status_request','request_delayed_support','request_mission_control_review'].includes(id)) sendMessage(s,`Demonstration request: ${action.name}.`);
  return commandState(s);
}
export function afterAction(s) {
  const result=commandState(s);
  return {scenario:result.active_scenario,initial_measurements:result.initial_measurements,selected_actions:result.selected_actions,final_measurements:result.mission.health,elapsed_hours:s.elapsed_hours,alerts:result.mission.alerts,events:[...s.events].reverse(),assumptions:result.active_scenario?.assumptions||['No emergency scenario activated.'],limitations:['Educational simulation only.','No real medical, spacecraft, or operational response is represented.'],generated_at:now()};
}
export function demoState(s) {
  const mission=state(s), d=s.demo;
  return {active:d.active,preset_name:'Mars Crew Health Demonstration',seed:7042,current_step:d.step,total_steps:catalog.demoSteps.length,step:catalog.demoSteps[d.step<0?8+d.step:d.step],steps:catalog.demoSteps,mission,alert_count:alerts(s).length,response_available:!!s.command.active};
}
export function startDemo(s) {
  if(!s.demo.active) { const snapshot=copy(s);delete snapshot.command;delete snapshot.demo;s.demo.snapshot=snapshot; }
  reset(s,7042);select(s,'phase','mars_surface');select(s,'scenario','elevated_workload');control(s,'start');advance(s,2);applyEffects(s,{stress_index:52,workload_index:18});
  s.command=clearCommand();activate(s,'elevated_workload');event(s,'demo_started','Mars Crew Health Demonstration started with seed 7042.');
  s.demo.active=true;s.demo.step=0;return demoState(s);
}
export function advanceDemo(s,steps) {
  if(!s.demo.active) throw new ApiError(409,'Start the guided demo before advancing.');
  // Python negative indices wrap; retain existing behavior for the allowed -8..8 range.
  s.demo.step=Math.min(7,s.demo.step+steps);
  s.demo.step=Math.max(-8,s.demo.step);
  if(steps>0&&s.demo.step===1&&s.status==='running') advance(s,1);
  return demoState(s);
}
export function exitDemo(s) {
  if(s.demo.snapshot) {s.command=clearCommand();Object.assign(s,copy(s.demo.snapshot));}
  s.demo={active:false,step:0,snapshot:null};return demoState(s);
}
