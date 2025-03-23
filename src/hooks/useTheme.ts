import { useState, useEffect } from "react";

type Theme = "light" | "dark" | "system";

// Функция для получения начальной темы
const getInitialTheme = (): Theme => {
  // Во время SSR всегда возвращаем "system", чтобы избежать недостатка соответствия
  if (typeof window === "undefined") return "system";
  try {
    const storedTheme = localStorage.getItem("theme") as Theme;
    return storedTheme || "system";
  } catch (e) {
    return "system";
  }
};

// Функция для получения начального разрешенного значения темы
const getInitialResolvedTheme = (): "light" | "dark" => {
  // На сервере всегда возвращаем "light", чтобы обеспечить согласованность сервера и клиента
  if (typeof window === "undefined") return "light";
  try {
    // Используем значение, установленное скриптом инициализации
    if (window.__THEME_RESOLVED) {
      return window.__THEME_RESOLVED;
    }

    // Если значение недоступно, определяем по системным настройкам
    const theme = getInitialTheme();
    if (theme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return theme as "light" | "dark";
  } catch (e) {
    return "light";
  }
};

export function useTheme() {
  // Предотвращаем выполнение useState во время SSR
  const isClient = typeof window !== "undefined";

  // Используем фиксированные начальные значения для SSR
  const [theme, setTheme] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  // Обновляем состояние только на клиенте в useEffect
  useEffect(() => {
    if (isClient) {
      setTheme(getInitialTheme());
      setResolvedTheme(getInitialResolvedTheme());
    }
  }, [isClient]);

  // Эффект для обновления темы при изменении системных настроек
  useEffect(() => {
    if (!isClient) return;

    // Функция для обновления темы на основе текущих настроек
    const updateTheme = () => {
      const root = window.document.documentElement;

      if (theme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
          .matches
          ? "dark"
          : "light";
        root.classList.remove("light", "dark");
        root.classList.add(systemTheme);
        setResolvedTheme(systemTheme);
      } else {
        root.classList.remove("light", "dark");
        root.classList.add(theme);
        setResolvedTheme(theme as "light" | "dark");
      }

      localStorage.setItem("theme", theme);
    };

    updateTheme();

    // Слушаем изменения системных настроек
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") {
        updateTheme();
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  return {
    theme,
    setTheme,
    resolvedTheme,
    isDark: resolvedTheme === "dark",
  };
}
