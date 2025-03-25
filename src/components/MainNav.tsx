"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CubeIcon,
  ListBulletIcon,
  CameraIcon,
  PlusIcon,
  CubeTransparentIcon,
  WrenchScrewdriverIcon,
  SwatchIcon,
  ChevronDownIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useState, useEffect, useRef } from "react";

const navItems = [
  { name: "Добавить товар", href: "/add-product", icon: PlusIcon },
  { name: "Список товаров", href: "/products", icon: ListBulletIcon },
  { name: "Сканировать штрихкод", href: "/scan", icon: CameraIcon },
  { name: "Управление коробками", href: "/boxes", icon: CubeTransparentIcon },
];

export default function MainNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Закрываем меню при переходе на другую страницу
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Закрываем меню при клике вне его области
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    }

    if (mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mobileMenuOpen]);

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 sm:h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center">
              <CubeIcon className="h-7 w-7 sm:h-8 sm:w-8 text-primary-600" />
              <span className="ml-2 sm:ml-3 text-lg sm:text-xl font-bold text-gray-900">
                MILA ERP
              </span>
            </Link>
          </div>

          {/* Десктопная навигация */}
          <div className="hidden md:flex items-center space-x-2 sm:space-x-6">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center px-2 sm:px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <item.icon
                    className={`h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 ${
                      isActive ? "text-primary-600" : "text-gray-500"
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Мобильная иконка меню */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
            >
              <span className="sr-only">Открыть меню</span>
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Мобильная навигация */}
      <div
        ref={menuRef}
        className={`md:hidden fixed inset-0 top-14 bg-gray-800 bg-opacity-50 transition-opacity duration-300 ${
          mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className={`bg-white pt-2 pb-3 h-screen w-64 max-w-[80%] transform transition-transform duration-300 ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="px-4">
            <p className="text-xs text-gray-500 mb-2 pb-2 border-b">
              Навигация
            </p>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-3 py-3 mb-1 rounded-md text-base font-medium ${
                    isActive
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon
                    className={`h-5 w-5 mr-3 ${
                      isActive ? "text-primary-600" : "text-gray-500"
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
