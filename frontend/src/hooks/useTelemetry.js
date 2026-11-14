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
    Promise.all([getAstronaut(), getHealthHistory()])
      .then(([astronautData, historyData]) => {
        if (!active) return;
        const measurements = Array.isArray(historyData) ? historyData : [];
        setAstronaut(astronautData);
        setHistory(measurements);
        if (measurements.length) setHealth(measurements[measurements.length - 1]);
        setIsLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setError("Unable to connect to the AstroHealth API.");
        setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!polling || !isRunning) return undefined;
    const initialRequest = setTimeout(receiveMeasurement, 0);
    const timer = setInterval(receiveMeasurement, POLL_INTERVAL);
    return () => { clearTimeout(initialRequest); clearInterval(timer); };
  }, [isRunning, polling, receiveMeasurement]);

  const chartData = useMemo(() => history.map((measurement) => ({ ...measurement, time: formatTime(measurement.timestamp) })), [history]);
  const reset = () => { setHistory([]); setHealth(null); setError(""); };

  return { health, astronaut, history, chartData, isRunning, setIsRunning, isLoading, error, reset, receiveMeasurement };
}
