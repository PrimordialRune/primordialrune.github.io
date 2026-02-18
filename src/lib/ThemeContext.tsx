"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export type DesignTheme = "original" | "industrial" | "retrowave";

const THEME_ORDER: DesignTheme[] = ["original", "industrial", "retrowave"];

const THEME_LABELS: Record<DesignTheme, string> = {
  original: "ORIGINAL",
  industrial: "INDUSTRIAL",
  retrowave: "RETROWAVE",
};

interface ThemeContextType {
  theme: DesignTheme;
  toggleTheme: () => void;
  themeLabel: string;
  isTransitioning: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "original",
  toggleTheme: () => {},
  themeLabel: "ORIGINAL",
  isTransitioning: false,
});

const STORAGE_KEY = "primordialrune-design-theme";
const TRANSITION_DURATION = 600; // ms, matches CSS transition

function isValidTheme(value: string): value is DesignTheme {
  return THEME_ORDER.includes(value as DesignTheme);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<DesignTheme>(() => {
    if (typeof window === "undefined") return "original";
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && isValidTheme(saved)) return saved;
    } catch {
      // Ignore localStorage errors
    }
    return "original";
  });
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Ignore localStorage errors
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setIsTransitioning(true);
    setTheme((prev) => {
      const currentIndex = THEME_ORDER.indexOf(prev);
      return THEME_ORDER[(currentIndex + 1) % THEME_ORDER.length];
    });
    // Clear transitioning state after CSS transitions complete
    setTimeout(() => setIsTransitioning(false), TRANSITION_DURATION);
  }, []);

  const themeLabel = THEME_LABELS[theme];

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, themeLabel, isTransitioning }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
