"use client";

import { useThemeContext } from "./ThemeProvider";
import {
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
} from "@heroicons/react/24/outline";

export function ThemeSwitcher() {
  const { theme, setTheme } = useThemeContext();

  return (
    <div
      className="flex items-center gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-800"
      suppressHydrationWarning
    >
      <button
        aria-label="Светлая тема"
        onClick={() => setTheme("light")}
        className={`p-2 rounded-md transition-colors ${
          theme === "light"
            ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100"
            : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        }`}
        suppressHydrationWarning
      >
        <SunIcon className="h-5 w-5" />
      </button>

      <button
        aria-label="Тёмная тема"
        onClick={() => setTheme("dark")}
        className={`p-2 rounded-md transition-colors ${
          theme === "dark"
            ? "bg-gray-900 text-gray-100 shadow-sm dark:bg-gray-700 dark:text-gray-100"
            : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        }`}
        suppressHydrationWarning
      >
        <MoonIcon className="h-5 w-5" />
      </button>

      <button
        aria-label="Системная тема"
        onClick={() => setTheme("system")}
        className={`p-2 rounded-md transition-colors ${
          theme === "system"
            ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100"
            : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        }`}
        suppressHydrationWarning
      >
        <ComputerDesktopIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
