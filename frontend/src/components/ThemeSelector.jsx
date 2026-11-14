import { Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "../context/useTheme";

export default function ThemeSelector() {
  const { resolvedTheme, setThemeMode } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const controlRef = useRef(null);
  const Icon = resolvedTheme === "light" ? Moon : Sun;
  const nextTheme = resolvedTheme === "light" ? "dark" : "light";

  useEffect(() => {
    if (!menuOpen) return undefined;
    const closeMenu = (event) => {
      if (!controlRef.current?.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", closeMenu);
    return () => document.removeEventListener("pointerdown", closeMenu);
  }, [menuOpen]);

  const openDeviceMenu = (event) => {
    event.preventDefault();
    setMenuOpen(true);
  };

  return (
    <div className="theme-control" ref={controlRef}>
      <button
        type="button"
        className="theme-toggle"
        aria-label={`Switch to ${nextTheme} mode`}
        title={`Switch to ${nextTheme} mode (right-click for device theme)`}
        onClick={() => setThemeMode(nextTheme)}
        onContextMenu={openDeviceMenu}
      >
        <Icon size={18} aria-hidden="true" />
      </button>
      {menuOpen && (
        <div className="theme-menu" role="menu">
          <button type="button" role="menuitem" onClick={() => { setThemeMode("system"); setMenuOpen(false); }}>
            Use device theme
          </button>
        </div>
      )}
    </div>
  );
}

