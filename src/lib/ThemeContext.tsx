"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export type DesignTheme = "industrial" | "retrowave";

interface ThemeContextType {
  theme: DesignTheme;
  toggleTheme: () => void;
  themeLabel: string;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "industrial",
  toggleTheme: () => {},
  themeLabel: "INDUSTRIAL",
});

const STORAGE_KEY = "primordialrune-design-theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<DesignTheme>(() => {
    if (typeof window === "undefined") return "industrial";
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "industrial" || saved === "retrowave") return saved;
    } catch {
      // Ignore localStorage errors
    }
    return "industrial";
  });

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
    setTheme((prev) => (prev === "industrial" ? "retrowave" : "industrial"));
  }, []);

  const themeLabel = theme === "industrial" ? "INDUSTRIAL" : "RETROWAVE";

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, themeLabel }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
