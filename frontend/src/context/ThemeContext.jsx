import { useEffect, useMemo, useState } from "react";
import { ThemeContext } from "./ThemeContext";

const STORAGE_KEY = "astrohealth-theme-mode";
const modes = ["system", "light", "dark"];

function getStoredMode() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return modes.includes(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }) {
  const [themeMode, setThemeMode] = useState(getStoredMode);
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);
  const resolvedTheme = themeMode === "system" ? systemTheme : themeMode;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event) => setSystemTheme(event.matches ? "dark" : "light");
    mediaQuery.addEventListener?.("change", handleChange);
    return () => mediaQuery.removeEventListener?.("change", handleChange);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
    try {
      window.localStorage.setItem(STORAGE_KEY, themeMode);
    } catch {
      // Theme still works when storage is unavailable.
    }
  }, [resolvedTheme, themeMode]);

  const value = useMemo(() => ({
    themeMode,
    resolvedTheme,
    setThemeMode: (mode) => {
      if (modes.includes(mode)) setThemeMode(mode);
    },
  }), [resolvedTheme, themeMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

