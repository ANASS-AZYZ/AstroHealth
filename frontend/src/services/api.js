import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
});

let sessionBootstrap;
let sessionRenewal;

const requestSession = (renew = false) => axios.get(`${API_BASE_URL}/api/session`, {
  params: renew ? { renew: true } : undefined,
  timeout: 10000,
  withCredentials: true,
});

export const initializeSession = () => {
  if (!sessionBootstrap) {
    sessionBootstrap = requestSession().catch((error) => {
      sessionBootstrap = undefined;
      throw error;
    });
  }
  return sessionBootstrap;
};

const renewSession = () => {
  if (!sessionRenewal) {
    sessionRenewal = requestSession(true).finally(() => {
      sessionRenewal = undefined;
      sessionBootstrap = undefined;
    });
  }
  return sessionRenewal;
};

api.interceptors.response.use(undefined, async (error) => {
  const request = error.config;
  const expired = error.response?.status === 401
    && error.response.headers["x-astrohealth-session-expired"] === "true";
  if (!expired || !request || request.sessionRetry) throw error;
  request.sessionRetry = true;
  await renewSession();
  return api.request(request);
});

export const getHealth = async () => {
  const response = await api.get("/api/health");
  return response.data;
};

export const getAstronaut = async () => {
  const response = await api.get("/api/astronaut");
  return response.data;
};

export const getLiveHealth = async () => {
  const response = await api.get("/api/health/live");
  return response.data;
};

export const getHealthHistory = async () => {
  const response = await api.get("/api/health/history");
  return response.data;
};

export const getAnalyticsSummary = async () => {
  const response = await api.get("/api/analytics/summary");
  return response.data;
};

export const getAnalyticsInsights = async () => {
  const response = await api.get("/api/analytics/insights");
  return response.data;
};

export const getAlerts = async () => {
  const response = await api.get("/api/alerts");
  return response.data;
};

export const acknowledgeAlert = async (alertId) => {
  const response = await api.post(`/api/alerts/${alertId}/acknowledge`);
  return response.data;
};

export const getDigitalTwin = async () => {
  const response = await api.get("/api/digital-twin");
  return response.data;
};

export const getMissionState = async () => {
  const response = await api.get("/api/mission/state");
  return response.data;
};

export const getMissionHistory = async () => {
  const response = await api.get("/api/mission/history");
  return response.data;
};

export const getMissionScenarios = async () => {
  const response = await api.get("/api/mission/scenarios");
  return response.data;
};

export const getMissionPhases = async () => {
  const response = await api.get("/api/mission/phases");
  return response.data;
};

export const startMission = async () => (await api.post("/api/mission/start")).data;
export const pauseMission = async () => (await api.post("/api/mission/pause")).data;
export const resumeMission = async () => (await api.post("/api/mission/resume")).data;
export const resetMission = async () => (await api.post("/api/mission/reset")).data;
export const advanceMission = async (ticks = 1) => (await api.post("/api/mission/advance", { ticks })).data;
export const setMissionScenario = async (scenario) => (await api.post("/api/mission/scenario", { scenario })).data;
export const setMissionPhase = async (phase) => (await api.post("/api/mission/phase", { phase })).data;
export const setMissionSpeed = async (speed) => (await api.post("/api/mission/speed", { speed })).data;
export const getMissionEvents = async () => (await api.get("/api/mission/events")).data;
export const getMissionReadiness = async () => (await api.get("/api/mission/readiness")).data;
export const compareMissionScenarios = async (scenario_a, scenario_b) => (await api.post("/api/mission/compare", { scenario_a, scenario_b, ticks: 12 })).data;
export const intelligenceDownloadUrl = (file) => `${api.defaults.baseURL}/api/export/${file}`;
export const missionHealthReportUrl = () => `${api.defaults.baseURL}/api/reports/mission-health`;
export const getCommandState = async () => (await api.get("/api/command/state")).data;
export const getCommandScenarios = async () => (await api.get("/api/command/scenarios")).data;
export const getCommandEvents = async () => (await api.get("/api/command/events")).data;
export const activateCommandScenario = async (scenario_id) => (await api.post("/api/command/activate", { scenario_id })).data;
export const respondToCommandScenario = async (action_id) => (await api.post("/api/command/respond", { action_id })).data;
export const sendCommandMessage = async (message) => (await api.post("/api/command/messages", { message })).data;
export const resetCommand = async () => (await api.post("/api/command/reset")).data;
export const commandDownloadUrl = (file) => `${api.defaults.baseURL}/api/command/${file}`;
export const getDemoStatus = async () => (await api.get("/api/demo/status")).data;
export const getDemoState = async () => (await api.get("/api/demo/state")).data;
export const startDemo = async () => (await api.post("/api/demo/start")).data;
export const advanceDemo = async (steps = 1) => (await api.post("/api/demo/advance", { steps })).data;
export const resetDemo = async () => (await api.post("/api/demo/reset")).data;
export const exitDemo = async () => (await api.post("/api/demo/exit")).data;
