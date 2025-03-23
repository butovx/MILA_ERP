import type { Metadata } from "next";
import "./globals.css";
import MainNav from "@/components/MainNav";
import { ThemeProvider } from "@/components/ThemeProvider";
import { themeScript } from "./theme-script";

export const metadata: Metadata = {
  title: "MILA ERP",
  description: "Система управления складом и ресурсами предприятия",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript() }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans">
        <ThemeProvider>
          <MainNav />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
            {children}
          </main>
          <footer className="bg-white dark:bg-gray-900 border-t dark:border-gray-800 mt-auto py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                © {new Date().getFullYear()} MILA ERP - Управление складом
              </p>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
