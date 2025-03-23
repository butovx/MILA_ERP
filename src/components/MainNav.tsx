"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CubeIcon,
  ListBulletIcon,
  CameraIcon,
  PlusIcon,
  CubeTransparentIcon,
  CheckCircleIcon,
  ServerIcon,
  CommandLineIcon,
} from "@heroicons/react/24/outline";
import { ThemeSwitcher } from "./ThemeSwitcher";

const navItems = [
  { name: "Добавить товар", href: "/add-product", icon: PlusIcon },
  { name: "Список товаров", href: "/products", icon: ListBulletIcon },
  { name: "Сканировать штрихкод", href: "/scan", icon: CameraIcon },
  { name: "Управление коробками", href: "/boxes", icon: CubeTransparentIcon },
  { name: "Список задач", href: "/todos", icon: CheckCircleIcon },
  { name: "Статус БД", href: "/db-status", icon: ServerIcon },
  { name: "Админ БД", href: "/db-admin", icon: CommandLineIcon },
];

export default function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-800 mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/home" className="flex items-center">
                <CubeIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                  MILA ERP
                </span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-base font-medium ${
                      isActive
                        ? "border-blue-600 text-gray-900 dark:text-white dark:border-blue-400"
                        : "border-transparent text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <item.icon
                      className={`h-5 w-5 mr-2 ${
                        isActive
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-gray-600 dark:text-gray-400"
                      }`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Добавляем переключатель темы */}
          <div className="flex items-center">
            <ThemeSwitcher />
          </div>
        </div>
      </div>

      {/* Мобильная навигация */}
      <div className="sm:hidden">
        <div className="pt-2 pb-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-3 text-base font-medium ${
                  isActive
                    ? "bg-blue-100 dark:bg-blue-900/40 border-l-4 border-blue-600 dark:border-blue-400 text-blue-800 dark:text-blue-300"
                    : "border-l-4 border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-600 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <item.icon
                  className={`h-5 w-5 mr-3 ${
                    isActive
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                />
                {item.name}
              </Link>
            );
          })}

          {/* Добавляем переключатель темы для мобильной версии */}
          <div className="px-3 py-3 flex justify-center">
            <ThemeSwitcher />
          </div>
        </div>
      </div>
    </nav>
  );
}
