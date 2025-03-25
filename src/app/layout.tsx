import type { Metadata, Viewport } from "next";
import "./globals.css";
import MainNav from "@/components/MainNav";
import { Toaster } from "@/components/ui/toaster";
import Link from "next/link";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

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
    <html lang="ru" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
          media="all"
        />
        {/* Фолбек для шрифтов, если загрузка не удалась */}
        <noscript>
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
            rel="stylesheet"
          />
        </noscript>
      </head>
      <body className="antialiased min-h-full flex flex-col bg-gray-50 text-gray-900 font-sans">
        <MainNav />
        <main className="flex-grow w-full mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 max-w-[100rem]">
          {children}
        </main>
        <footer className="bg-white border-t mt-auto py-4 sm:py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-xs sm:text-sm text-gray-600">
                © {new Date().getFullYear()} MILA ERP - Управление складом
              </p>
              <div className="flex gap-4 sm:gap-6">
                <Link
                  href="/help"
                  className="text-xs sm:text-sm text-gray-600 hover:text-gray-900"
                >
                  Помощь
                </Link>
                <Link
                  href="/privacy"
                  className="text-xs sm:text-sm text-gray-600 hover:text-gray-900"
                >
                  Конфиденциальность
                </Link>
                <Link
                  href="/about"
                  className="text-xs sm:text-sm text-gray-600 hover:text-gray-900"
                >
                  О нас
                </Link>
              </div>
            </div>
          </div>
        </footer>
        <Toaster />
      </body>
    </html>
  );
}
