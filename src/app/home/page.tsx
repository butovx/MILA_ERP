"use client";

import { H1, H2, H3, Text, LargeText } from "@/components/Typography";
import Link from "next/link";
import {
  CubeIcon,
  ListBulletIcon,
  CameraIcon,
  PlusIcon,
  CubeTransparentIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

export default function HomePage() {
  const features = [
    {
      title: "Управление товарами",
      description:
        "Добавление, редактирование и удаление товаров в системе учета",
      icon: ListBulletIcon,
      link: "/products",
    },
    {
      title: "Быстрый ввод",
      description:
        "Добавление новых товаров в базу данных с загрузкой фотографий",
      icon: PlusIcon,
      link: "/add-product",
    },
    {
      title: "Сканирование штрихкодов",
      description: "Быстрый поиск и учет товаров с помощью сканера штрихкодов",
      icon: CameraIcon,
      link: "/scan",
    },
    {
      title: "Управление коробками",
      description:
        "Создание и управление складскими коробками для оптимизации хранения",
      icon: CubeTransparentIcon,
      link: "/boxes",
    },
  ];

  return (
    <div className="py-8">
      <header className="mb-12 text-center">
        <div className="flex justify-center mb-6">
          <CubeIcon className="h-16 w-16 text-blue-600 dark:text-blue-400" />
        </div>
        <H1 className="text-4xl md:text-5xl mb-4">
          Добро пожаловать в MILA ERP
        </H1>
        <LargeText className="max-w-3xl mx-auto">
          Система управления складом и ресурсами предприятия, разработанная для
          оптимизации бизнес-процессов и повышения эффективности работы
        </LargeText>
      </header>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        {features.map((feature, index) => (
          <Link
            key={index}
            href={feature.link}
            className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-gray-900/50 rounded-lg p-6 
                      transition-transform hover:scale-[1.02] hover:shadow-xl"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <feature.icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <H3 className="mb-2">{feature.title}</H3>
                <Text className="mb-0 text-gray-600 dark:text-gray-400">
                  {feature.description}
                </Text>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-8">
        <H2 className="mb-6 text-center">Начните работу прямо сейчас</H2>
        <Text className="text-center mb-6">
          MILA ERP предоставляет комплексное решение для управления товарами,
          складскими операциями и ресурсами вашего предприятия
        </Text>
        <div className="flex justify-center">
          <Link
            href="/products"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base 
                     font-medium rounded-md shadow-sm text-white bg-blue-600 dark:bg-blue-700 
                     hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 
                     focus:ring-offset-2 focus:ring-blue-600 dark:focus:ring-blue-500"
          >
            <ChartBarIcon className="h-5 w-5 mr-2" />
            Перейти к обзору товаров
          </Link>
        </div>
      </div>
    </div>
  );
}
