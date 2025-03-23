"use client";

import { createContext, useContext, ReactNode, useEffect } from "react";
import { useTheme } from "@/hooks/useTheme";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const themeValue = useTheme();

  // Применяем тему к HTML элементу при изменении темы
  useEffect(() => {
    if (themeValue.resolvedTheme) {
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(themeValue.resolvedTheme);
    }
  }, [themeValue.resolvedTheme]);

  return (
    <ThemeContext.Provider value={themeValue}>{children}</ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useThemeContext must be used within a ThemeProvider");
  }
  return context;
}
