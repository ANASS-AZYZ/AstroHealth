"""Generate migration inventory and golden fixtures from the unchanged Python backend."""
import dataclasses
import json
from pathlib import Path
import sys

root = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(root / "backend"))
from main import app
from fastapi.testclient import TestClient
from services.scenario_engine import PHASES, SCENARIOS
from services.command_service import SCENARIOS as EMERGENCIES
from services.demo_service import DEMO_STEPS
from services.alert_engine import ALERT_RULES
from services.nasa_evidence_service import get_nasa_evidence
from services.mission_simulator import MissionSimulator

out = root / "frontend" / "functions" / "_lib"
out.mkdir(parents=True, exist_ok=True)
constants = dict(phases=PHASES, scenarios={k: dataclasses.asdict(v) for k,v in SCENARIOS.items()}, emergencies={k: dataclasses.asdict(v) for k,v in EMERGENCIES.items()}, demoSteps=DEMO_STEPS, alertRules=ALERT_RULES, nasa=get_nasa_evidence().model_dump())
(out / "catalog.js").write_text("// Curated constants ported verbatim from backend/services; regenerate with scripts/reference-fixtures.py.\nexport default " + json.dumps(constants, indent=2) + ";\n", encoding="utf-8")
routes = [{"path": path, "methods": [method.upper()], "endpoint": definition['operationId']} for path, methods in app.openapi()['paths'].items() if path.startswith('/api/') for method, definition in methods.items()]
(root / "docs" / "cloudflare-route-inventory.json").write_text(json.dumps(routes, indent=2)+"\n")
cases = []
with TestClient(app) as client:
    client.get('/api/session')
    operations = [('GET', r['path'], None) for r in routes if 'GET' in r['methods'] and '{' not in r['path'] and not r['path'].endswith(('.pdf','.csv')) and '/reports/' not in r['path']]
    operations += [('POST','/api/mission/scenario',{'scenario': 'sleep_disruption'}), ('POST','/api/mission/advance',{'ticks': 12}), ('GET','/api/analytics/summary',None), ('GET','/api/mission/readiness',None), ('POST','/api/mission/compare',{'scenario_a':'nominal','scenario_b':'eva_activity','ticks':12}), ('POST','/api/command/activate',{'scenario_id':'elevated_workload'}), ('POST','/api/command/respond',{'action_id':'reduce_activity'}), ('POST','/api/demo/start',None), ('POST','/api/demo/advance',{'steps':1}), ('POST','/api/demo/exit',None)]
    for method,path,body in operations:
        response = client.request(method,path,json=body) if body is not None else client.request(method,path)
        cases.append(dict(method=method,path=path,body=body,status=response.status_code,payload=response.json()))
fixtures = root / 'frontend' / 'tests' / 'fixtures'
fixtures.mkdir(parents=True, exist_ok=True)
(fixtures / 'python-contracts.json').write_text(json.dumps(cases,indent=2)+"\n", encoding='utf-8')
simulations=[]
for seed in (42,2026,7042):
    for scenario in SCENARIOS:
        for phase in PHASES:
            simulator=MissionSimulator(seed=seed,track_events=False)
            simulator.set_scenario(scenario)
            simulator.set_phase(phase['id'])
            simulator.start()
            simulator.advance(30)
            simulations.append(dict(seed=seed,scenario=scenario,phase=phase['id'],health=simulator.state().health.model_dump(exclude={'timestamp'})))
(fixtures / 'python-simulations.json').write_text(json.dumps(simulations,indent=2)+"\n",encoding='utf-8')
print(f'Inventoried {len(routes)} routes; generated {len(cases)} sequential reference contracts.')
