import { useCallback, useEffect, useMemo, useState } from "react";
import { getAstronaut, getHealthHistory, getLiveHealth } from "../services/api";
import { formatTime } from "../utils/telemetry";

const POLL_INTERVAL = 5000;

export function useTelemetry({ polling = true } = {}) {
  const [health, setHealth] = useState(null);
  const [astronaut, setAstronaut] = useState(null);
  const [history, setHistory] = useState([]);
  const [isRunning, setIsRunning] = useState(polling);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const receiveMeasurement = useCallback(async () => {
    try {
      const [measurement, historyData] = await Promise.all([getLiveHealth(), getHealthHistory()]);
      setHealth(measurement);
      setHistory(Array.isArray(historyData) ? historyData : []);
      setError("");
      setIsLoading(false);
    } catch {
      setError("Connection unavailable. Retrying on the next cycle.");
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    let pending = false;
    const load = async () => {
      if (pending) return;
      pending = true;
      try {
        const [astronautData, measurement, historyData] = await Promise.all([
          getAstronaut(), getLiveHealth(), getHealthHistory(),
        ]);
        if (!active) return;
        setAstronaut(astronautData);
        setHealth(measurement);
        setHistory(Array.isArray(historyData) ? historyData : []);
        setError("");
      } catch {
        if (active) setError("Unable to connect to the AstroHealth API.");
      } finally {
        pending = false;
        if (active) setIsLoading(false);
      }
    };
    void load();
    const timer = polling && isRunning ? setInterval(load, POLL_INTERVAL) : null;
    return () => { active = false; if (timer) clearInterval(timer); };
  }, [polling, isRunning]);

  const chartData = useMemo(() => (history.length ? history : health ? [health] : []).map((measurement) => ({ ...measurement, time: formatTime(measurement.timestamp) })), [history, health]);
  const reset = () => { setHistory([]); setHealth(null); setError(""); };

  return { health, astronaut, history, chartData, isRunning, setIsRunning, isLoading, error, reset, receiveMeasurement };
}
