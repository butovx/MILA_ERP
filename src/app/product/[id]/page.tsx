import { Suspense } from "react";
import Link from "next/link";
import { Product } from "@/types";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import ProductImage from "@/components/ProductImage";
import React from "react";
import ProductDisplay from "@/components/product/ProductDisplay";

interface ProductPageProps {
  params: {
    id: string;
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  // Используем await для доступа к params
  const id = params.id;

  return (
    <Suspense
      fallback={
        <div className="py-8 text-center">
          <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="mt-2 text-gray-600">Загрузка...</p>
        </div>
      }
    >
      <ProductDisplay productId={id} />
    </Suspense>
  );
}
