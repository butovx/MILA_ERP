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
} from "@heroicons/react/24/outline";
import { useState } from "react";

const navItems = [
  { name: "Добавить товар", href: "/add-product", icon: PlusIcon },
  { name: "Список товаров", href: "/products", icon: ListBulletIcon },
  { name: "Сканировать штрихкод", href: "/scan", icon: CameraIcon },
  { name: "Управление коробками", href: "/boxes", icon: CubeTransparentIcon },
  { name: "Обслуживание", href: "/maintenance", icon: WrenchScrewdriverIcon },
];

export default function MainNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/home" className="flex items-center">
              <CubeIcon className="h-8 w-8 text-primary-600" />
              <span className="ml-3 text-xl font-bold text-gray-900">
                MILA ERP
              </span>
            </Link>
          </div>

          {/* Десктопная навигация */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <item.icon
                    className={`h-5 w-5 mr-2 ${
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
            >
              <span className="sr-only">Открыть меню</span>
              {mobileMenuOpen ? (
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Мобильная навигация */}
      <div className={`md:hidden ${mobileMenuOpen ? "block" : "hidden"}`}>
        <div className="pt-2 pb-3 space-y-1 px-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
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
    </nav>
  );
}
