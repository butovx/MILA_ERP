export function themeScript() {
  const themeScript = `
    (function() {
      function getStoredTheme() {
        try {
          return localStorage.getItem('theme') || 'system';
        } catch (e) {
          return 'system';
        }
      }
      
      function getSystemTheme() {
        try {
          return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        } catch (e) {
          return 'light';
        }
      }
      
      function getResolvedTheme() {
        const theme = getStoredTheme();
        return theme === 'system' ? getSystemTheme() : theme;
      }
      
      // Установим глобальную переменную для React
      window.__THEME_RESOLVED = getResolvedTheme();
      
      // Также применим классы к document.documentElement сразу,
      // чтобы избежать мигания контента и проблем с гидратацией
      const resolvedTheme = window.__THEME_RESOLVED;
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(resolvedTheme);
    })();
  `;

  return themeScript;
}
