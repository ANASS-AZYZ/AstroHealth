import { useEffect } from "react";
import { advanceMission, getMissionState } from "../services/api";

// Own the frontend clock once per connected app, outside lazy route lifecycles.
export function useMissionClock() {
  useEffect(() => {
    let active = true;
    let pending = false;
    const tick = async () => {
      if (pending) return;
      pending = true;
      try {
        const state = await getMissionState();
        if (active && state.status === "running") await advanceMission(state.speed);
      } catch {
        // Route data loaders expose connection errors; retry on the next tick.
      } finally {
        pending = false;
      }
    };
    const timer = setInterval(tick, 1000);
    return () => { active = false; clearInterval(timer); };
  }, []);
}
