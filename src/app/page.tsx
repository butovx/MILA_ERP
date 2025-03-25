"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CubeIcon,
  ChartBarIcon,
  QrCodeIcon,
  CubeTransparentIcon,
  ShoppingCartIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { H1, H2, H3, Text, LargeText } from "@/components/Typography";

export default function HomePage() {
  const features = [
    {
      title: "Управление товарами",
      description:
        "Добавляйте, редактируйте и удаляйте товары. Отслеживайте наличие и характеристики.",
      icon: ShoppingCartIcon,
      link: "/products",
    },
    {
      title: "Управление коробками",
      description:
        "Создавайте коробки для организации товаров, отслеживайте перемещения и содержимое.",
      icon: CubeTransparentIcon,
      link: "/boxes",
    },
    {
      title: "Сканирование штрих-кодов",
      description:
        "Сканируйте штрих-коды товаров и коробок для быстрого доступа к информации.",
      icon: QrCodeIcon,
      link: "/scan",
    },
    {
      title: "Добавление нового товара",
      description:
        "Быстро создавайте новые товары с описанием, фотографиями и штрих-кодами.",
      icon: PlusIcon,
      link: "/add-product",
    },
  ];

  return (
    <div className="py-6 sm:py-8">
      <header className="mb-8 sm:mb-12 text-center">
        <div className="flex justify-center mb-4 sm:mb-6">
          <CubeIcon className="h-12 w-12 sm:h-16 sm:w-16 text-primary-600" />
        </div>
        <H1 className="text-3xl sm:text-4xl md:text-5xl mb-3 sm:mb-4 px-2">
          Добро пожаловать в MILA ERP
        </H1>
        <LargeText className="max-w-3xl mx-auto px-4 text-sm sm:text-base">
          Система управления складом и ресурсами предприятия, разработанная для
          оптимизации бизнес-процессов и повышения эффективности работы
        </LargeText>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12 px-3 sm:px-0">
        {features.map((feature, index) => (
          <Link
            key={index}
            href={feature.link}
            className="bg-white shadow-md sm:shadow-lg rounded-lg p-4 sm:p-6 
                      transition-transform hover:scale-[1.02] hover:shadow-xl"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 p-2 sm:p-3 bg-primary-100 rounded-lg">
                <feature.icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <H3 className="mb-1 sm:mb-2 text-base sm:text-lg">
                  {feature.title}
                </H3>
                <Text className="mb-0 text-gray-600 text-xs sm:text-sm">
                  {feature.description}
                </Text>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-primary-50 rounded-lg p-5 sm:p-8 mx-3 sm:mx-0">
        <H2 className="mb-4 sm:mb-6 text-center text-xl sm:text-2xl">
          Начните работу прямо сейчас
        </H2>
        <Text className="text-center mb-5 sm:mb-6 text-sm sm:text-base">
          MILA ERP предоставляет комплексное решение для управления товарами,
          складскими операциями и ресурсами вашего предприятия
        </Text>
        <div className="flex justify-center">
          <Link
            href="/products"
            className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 border border-transparent text-sm sm:text-base 
                     font-medium rounded-md shadow-sm text-white bg-primary-600 
                     hover:bg-primary-700 focus:outline-none focus:ring-2 
                     focus:ring-offset-2 focus:ring-primary-600"
          >
            <ChartBarIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Перейти к обзору товаров
          </Link>
        </div>
      </div>
    </div>
  );
}
