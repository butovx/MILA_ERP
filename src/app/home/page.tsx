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
    <div className="py-8">
      <header className="mb-12 text-center">
        <div className="flex justify-center mb-6">
          <CubeIcon className="h-16 w-16 text-primary-600" />
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
            className="bg-white shadow-lg rounded-lg p-6 
                      transition-transform hover:scale-[1.02] hover:shadow-xl"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 p-3 bg-primary-100 rounded-lg">
                <feature.icon className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-4">
                <H3 className="mb-2">{feature.title}</H3>
                <Text className="mb-0 text-gray-600">
                  {feature.description}
                </Text>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-primary-50 rounded-lg p-8">
        <H2 className="mb-6 text-center">Начните работу прямо сейчас</H2>
        <Text className="text-center mb-6">
          MILA ERP предоставляет комплексное решение для управления товарами,
          складскими операциями и ресурсами вашего предприятия
        </Text>
        <div className="flex justify-center">
          <Link
            href="/products"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base 
                     font-medium rounded-md shadow-sm text-white bg-primary-600 
                     hover:bg-primary-700 focus:outline-none focus:ring-2 
                     focus:ring-offset-2 focus:ring-primary-600"
          >
            <ChartBarIcon className="h-5 w-5 mr-2" />
            Перейти к обзору товаров
          </Link>
        </div>
      </div>
    </div>
  );
}
