"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Product } from "@/types";
import {
  PencilIcon,
  TrashIcon,
  ArrowTopRightOnSquareIcon,
  CheckIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { H1, H2, Text, ErrorText } from "@/components/Typography";
import ProductImage from "@/components/ProductImage";
import DataTable from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import JsBarcode from "jsbarcode";
import { useRouter } from "next/navigation";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);

  // Состояние для режима выбора
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [deletingProductsIds, setDeletingProductsIds] = useState<number[]>([]);

  // Состояние для работы с коробками
  const [boxes, setBoxes] = useState<
    { id: number; name: string; barcode: string }[]
  >([]);
  const [selectedBoxId, setSelectedBoxId] = useState<number | null>(null);
  const [isLoadingBoxes, setIsLoadingBoxes] = useState(false);
  const [isAddingToBox, setIsAddingToBox] = useState(false);
  const [quantityToAdd, setQuantityToAdd] = useState<number>(1);

  const router = useRouter();

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      filterProducts();
    }
  }, [searchQuery, products]);

  useEffect(() => {
    if (selectionMode && selectedProducts.length > 0) {
      fetchBoxes();
    }
  }, [selectionMode, selectedProducts.length]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/products");
      if (!response.ok) {
        throw new Error("Ошибка при получении данных");
      }
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      setError("Не удалось загрузить список товаров");
      console.error(err);
      toast.error({
        id: genId(),
        title: "Ошибка",
        description: "Не удалось загрузить список товаров",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBoxes = async () => {
    try {
      setIsLoadingBoxes(true);
      const response = await fetch("/api/boxes");
      if (!response.ok) {
        throw new Error("Ошибка при получении списка коробок");
      }
      const data = await response.json();
      setBoxes(data);
    } catch (err) {
      console.error("Не удалось загрузить список коробок:", err);
      toast.error({
        id: genId(),
        title: "Ошибка",
        description: "Не удалось загрузить список коробок",
      });
    } finally {
      setIsLoadingBoxes(false);
    }
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedProducts([]);
    setIsAllSelected(false);
    setSelectedBoxId(null);
  };

  const toggleProductSelection = (productId: number) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter((id) => id !== productId));
    } else {
      setSelectedProducts([...selectedProducts, productId]);
    }
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((product) => product.id));
    }
    setIsAllSelected(!isAllSelected);
  };

  const deleteSelectedProducts = async () => {
    if (selectedProducts.length === 0) return;

    if (
      !confirm(
        `Вы действительно хотите удалить выбранные товары (${selectedProducts.length} шт.)?\nЭто действие нельзя отменить.`
      )
    ) {
      return;
    }

    setDeletingProductsIds([...selectedProducts]);

    try {
      const results = await Promise.all(
        selectedProducts.map((id) =>
          fetch(`/api/products/${id}`, { method: "DELETE" })
        )
      );

      const allSuccessful = results.every((res) => res.ok);

      if (allSuccessful) {
        setProducts(products.filter((p) => !selectedProducts.includes(p.id)));
        toast.success({
          id: genId(),
          title: "Успешно",
          description: `Удалено ${selectedProducts.length} товаров`,
        });
        setSelectedProducts([]);
      } else {
        toast.error({
          id: genId(),
          title: "Ошибка",
          description: "Произошла ошибка при удалении некоторых товаров",
        });
      }
    } catch (error) {
      console.error("Ошибка при удалении товаров:", error);
      toast.error({
        id: genId(),
        title: "Ошибка",
        description: "Произошла ошибка при удалении товаров",
      });
    } finally {
      setDeletingProductsIds([]);
    }
  };

  const addSelectedProductsToBox = async () => {
    if (selectedProducts.length === 0 || !selectedBoxId) return;

    setIsAddingToBox(true);

    try {
      const response = await fetch("/api/box-items/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          box_id: selectedBoxId,
          product_ids: selectedProducts,
          quantity: quantityToAdd,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        const selectedBox = boxes.find((box) => box.id === selectedBoxId);
        toast.success({
          id: genId(),
          title: "Успешно",
          description: `${selectedProducts.length} товаров добавлено в коробку "${selectedBox?.name}"`,
        });

        // Обновляем список товаров, чтобы отразить новые связи с коробками
        fetchProducts();

        // Сбрасываем выбор
        setSelectedProducts([]);
        setSelectedBoxId(null);
      } else {
        toast.error({
          id: genId(),
          title: "Ошибка",
          description:
            result.error || "Произошла ошибка при добавлении товаров в коробку",
        });
      }
    } catch (error) {
      console.error("Ошибка при добавлении товаров в коробку:", error);
      toast.error({
        id: genId(),
        title: "Ошибка",
        description: "Произошла ошибка при добавлении товаров в коробку",
      });
    } finally {
      setIsAddingToBox(false);
    }
  };

  const columns = [
    ...(selectionMode
      ? [
          {
            key: "select",
            header: (
              <div className="flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>
            ),
            render: (product: Product) => (
              <div className="flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={selectedProducts.includes(product.id)}
                  onChange={() => toggleProductSelection(product.id)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>
            ),
            mobilePriority: 1,
          },
        ]
      : []),
    {
      key: "id",
      header: "ID",
      render: (product: Product) => (
        <div className="font-mono text-gray-600 w-[60px] text-center">
          {product.id}
        </div>
      ),
      mobilePriority: 3,
    },
    {
      key: "photo",
      header: "Фото",
      render: (product: Product) =>
        product.photo_paths && product.photo_paths.length > 0 ? (
          <Link
            href={`/product/${product.id}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-8 w-8 md:h-8 md:w-8 sm:w-24 sm:h-24 xs:w-20 xs:h-20 relative">
              <ProductImage
                src={product.photo_paths[0]}
                alt={product.name}
                fill
                className="rounded-md object-cover"
              />
            </div>
          </Link>
        ) : (
          <Link
            href={`/product/${product.id}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-8 w-8 md:h-8 md:w-8 sm:w-24 sm:h-24 xs:w-20 xs:h-20 bg-gray-200 rounded-md flex items-center justify-center">
              <span className="text-gray-500 text-xs">Нет</span>
            </div>
          </Link>
        ),
      mobilePriority: 1,
    },
    {
      key: "name",
      header: "Название",
      render: (product: Product) => (
        <Link
          href={`/product/${product.id}`}
          className="text-blue-600 hover:text-blue-800"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="max-w-[350px] min-w-[200px]" title={product.name}>
            {product.name}
          </div>
        </Link>
      ),
      mobilePriority: 1,
    },
    {
      key: "quantity",
      header: "Количество",
      render: (product: Product) => (
        <div className="w-[70px] text-center">{product.quantity ?? "-"}</div>
      ),
      mobilePriority: 2,
    },
    {
      key: "price",
      header: "Цена",
      render: (product: Product) => (
        <div className="w-[80px] text-right">
          {product.price ? `${product.price} ₽` : "-"}
        </div>
      ),
      mobilePriority: 2,
    },
    {
      key: "category",
      header: "Категория",
      render: (product: Product) => (
        <div className="w-[120px]">{product.category || "-"}</div>
      ),
      mobilePriority: 3,
    },
    {
      key: "barcode",
      header: "Штрихкод",
      render: (product: Product) => (
        <div className="font-mono w-[120px]">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              downloadBarcode(product.barcode);
            }}
            className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
            title="Нажмите для скачивания штрихкода"
          >
            {product.barcode}
          </a>
        </div>
      ),
      mobilePriority: 3,
    },
    {
      key: "boxes",
      header: "Коробки",
      render: (product: Product) =>
        product.boxes && product.boxes.length > 0 ? (
          <div className="flex flex-wrap gap-1 max-w-[140px]">
            {product.boxes.slice(0, 2).map((box, index) => (
              <Link
                key={index}
                href={`/box-content?barcode=${box.barcode}`}
                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                onClick={(e) => e.stopPropagation()}
              >
                {box.name.length > 10
                  ? box.name.slice(0, 10) + "..."
                  : box.name}
              </Link>
            ))}
            {product.boxes.length > 2 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                +{product.boxes.length - 2}
              </span>
            )}
          </div>
        ) : (
          <div className="w-[120px] text-center">-</div>
        ),
      mobilePriority: 3,
    },
  ];

  // Функция для скачивания штрихкода
  const downloadBarcode = (barcode: string) => {
    // Создаем временный элемент canvas с компонентом Barcode
    const tempCanvas = document.createElement("canvas");
    tempCanvas.id = `temp-barcode-${barcode}`;
    document.body.appendChild(tempCanvas);

    try {
      JsBarcode(tempCanvas, barcode, {
        format: "EAN13",
        width: 1.5,
        height: 80,
        displayValue: true,
        fontSize: 16,
        margin: 10,
        background: "#ffffff",
        lineColor: "#000000",
      });

      // Скачивание штрихкода
      const link = document.createElement("a");
      link.download = `barcode-${barcode}.png`;
      link.href = tempCanvas.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();

      // Удаляем временные элементы
      document.body.removeChild(link);
      document.body.removeChild(tempCanvas);

      toast.success({
        id: genId(),
        title: "Успешно",
        description: `Штрихкод ${barcode} скачан`,
      });
    } catch (error) {
      console.error("Ошибка при создании штрих-кода:", error);
      toast.error({
        id: genId(),
        title: "Ошибка",
        description: "Не удалось скачать штрихкод",
      });
    }
  };

  // Навигация на страницу товара
  const handleRowClick = (product: Product) => {
    router.push(`/product/${product.id}`);
  };

  // Добавляем функцию genId на основе существующего кода
  const genId = () => {
    return Math.random().toString(36).substring(2, 9);
  };

  const filterProducts = () => {
    if (!searchQuery.trim()) {
      setSearchResults(products);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.barcode.includes(query) ||
        (product.category && product.category.toLowerCase().includes(query)) ||
        String(product.id).includes(query)
    );

    setSearchResults(filtered);
  };

  if (loading) {
    return (
      <div className="py-8 flex justify-center">
        <div className="animate-pulse text-center">
          <div className="h-8 w-64 bg-gray-200 rounded mb-4 mx-auto"></div>
          <div className="h-4 w-48 bg-gray-200 rounded mb-2.5 mx-auto"></div>
          <Text>Загрузка списка товаров...</Text>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <H2>Ошибка загрузки</H2>
        <div className="max-w-md mx-auto bg-red-50 p-4 rounded-lg mt-4">
          <ErrorText>{error}</ErrorText>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-4">
        <H1>Список товаров</H1>
        <div className="flex gap-3">
          {selectionMode ? (
            <>
              <Button
                variant="outline"
                onClick={toggleSelectionMode}
                className="text-sm"
              >
                Отменить выбор
              </Button>
              <Button
                variant="destructive"
                onClick={deleteSelectedProducts}
                disabled={selectedProducts.length === 0}
                className="text-sm"
              >
                Удалить выбранные ({selectedProducts.length})
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={toggleSelectionMode}
                className="text-sm hidden sm:inline-flex"
              >
                Выбрать товары
              </Button>
              <Link href="/add-product" className="w-full sm:w-auto">
                <Button className="text-sm" size="mobile" fullWidthMobile>
                  + Добавить товар
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию, ID, штрихкоду или категории..."
            className="pl-10 pr-4 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {selectionMode && selectedProducts.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-medium mb-2">
            Выбрано товаров: {selectedProducts.length}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Выберите коробку:
              </label>
              <div className="flex flex-wrap gap-2">
                {isLoadingBoxes ? (
                  <div className="animate-pulse w-full h-10 bg-gray-200 rounded"></div>
                ) : boxes.length === 0 ? (
                  <p className="text-gray-500">Нет доступных коробок</p>
                ) : (
                  <select
                    value={selectedBoxId || ""}
                    onChange={(e) => setSelectedBoxId(Number(e.target.value))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600"
                  >
                    <option value="">Выберите коробку</option>
                    {boxes.map((box) => (
                      <option key={box.id} value={box.id}>
                        {box.name} (#{box.barcode})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Количество:
              </label>
              <input
                type="number"
                min="1"
                value={quantityToAdd}
                onChange={(e) =>
                  setQuantityToAdd(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={addSelectedProductsToBox}
              disabled={isAddingToBox || !selectedBoxId}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
            >
              {isAddingToBox ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Добавление...
                </>
              ) : (
                "Добавить в коробку"
              )}
            </button>
          </div>
        </div>
      )}

      {!loading && searchResults.length === 0 && (
        <div className="mt-6 text-center py-8 bg-gray-50 rounded-lg">
          <Text className="text-gray-500">
            {searchQuery.trim()
              ? "По вашему запросу ничего не найдено"
              : "Список товаров пуст"}
          </Text>
        </div>
      )}

      <Card className="mt-6">
        <CardHeader className="pb-2">
          <CardTitle>
            {searchQuery.trim() && searchResults.length > 0
              ? `Найдено товаров: ${searchResults.length}`
              : `Все товары: ${products.length}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={searchResults}
            emptyMessage={
              searchQuery.trim()
                ? "По вашему запросу ничего не найдено"
                : "Список товаров пуст"
            }
            onRowClick={handleRowClick}
          />
        </CardContent>
      </Card>
    </div>
  );
}
