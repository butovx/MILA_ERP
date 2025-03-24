"use client";

import { useState } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { H1, Label, ErrorText, SuccessText } from "@/components/Typography";
import Barcode from "@/components/Barcode";

export default function AddProductPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    description: "",
    price: "",
    category: "",
  });
  const [files, setFiles] = useState<FileList | null>(null);
  const [result, setResult] = useState<{
    message?: string;
    error?: string;
    barcode?: string;
  } | null>(null);
  const [barcodeDownloaded, setBarcodeDownloaded] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(e.target.files);
    }
  };

  // Функция загрузки штрих-кода
  const downloadBarcode = (barcode: string) => {
    const barcodeCanvas = document.getElementById(
      `barcode-${barcode}`
    ) as HTMLCanvasElement;
    if (barcodeCanvas) {
      const a = document.createElement("a");
      a.href = barcodeCanvas.toDataURL("image/png");
      a.download = `barcode-${barcode}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setBarcodeDownloaded(true);
    } else {
      console.error("Штрихкод не найден на странице");
      alert("Не удалось скачать штрихкод");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);
    setBarcodeDownloaded(false);

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value);
      });

      if (files) {
        Array.from(files).forEach((file) => {
          data.append("photos", file);
        });
      }

      const response = await fetch("/api/products", {
        method: "POST",
        body: data,
      });

      const result = await response.json();

      if (response.ok) {
        // Используем поле barcode, переданное с сервера
        const barcode = result.barcode;

        setResult({
          message: result.message,
          barcode: barcode,
        });

        setFormData({
          name: "",
          quantity: "",
          description: "",
          price: "",
          category: "",
        });
        setFiles(null);

        // Сбрасываем input для файлов
        const fileInput = document.getElementById("photos") as HTMLInputElement;
        if (fileInput) fileInput.value = "";

        // Если штрих-код найден, скачиваем его
        if (barcode) {
          // Добавляем небольшую задержку, чтобы компонент Barcode успел отрисоваться
          setTimeout(() => {
            downloadBarcode(barcode); // Автоматически скачиваем штрих-код
          }, 500);
        }
      } else {
        setResult({
          error: result.error || "Произошла ошибка при добавлении товара",
        });
      }
    } catch (error) {
      setResult({ error: "Произошла ошибка при отправке формы" });
      console.error("Ошибка при отправке формы:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-8">
      <H1>Добавить товар</H1>

      <div className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-gray-900/50 rounded-lg p-8 mb-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name">Название:</Label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm dark:shadow-gray-900/10 focus:border-blue-600 focus:ring-blue-600 dark:focus:border-blue-500 dark:focus:ring-blue-500 text-base py-2 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div>
            <Label htmlFor="quantity">Количество:</Label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm dark:shadow-gray-900/10 focus:border-blue-600 focus:ring-blue-600 dark:focus:border-blue-500 dark:focus:ring-blue-500 text-base py-2 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div>
            <Label htmlFor="description">Описание:</Label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm dark:shadow-gray-900/10 focus:border-blue-600 focus:ring-blue-600 dark:focus:border-blue-500 dark:focus:ring-blue-500 text-base py-2 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div>
            <Label htmlFor="price">Цена:</Label>
            <input
              type="number"
              step="0.01"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm dark:shadow-gray-900/10 focus:border-blue-600 focus:ring-blue-600 dark:focus:border-blue-500 dark:focus:ring-blue-500 text-base py-2 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div>
            <Label htmlFor="category">Категория:</Label>
            <input
              type="text"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm dark:shadow-gray-900/10 focus:border-blue-600 focus:ring-blue-600 dark:focus:border-blue-500 dark:focus:ring-blue-500 text-base py-2 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div>
            <Label htmlFor="photos">Фотографии товара (до 10):</Label>
            <input
              type="file"
              id="photos"
              name="photos"
              onChange={handleFileChange}
              multiple
              accept="image/*"
              className="mt-1 block w-full text-base text-gray-700 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-base file:font-semibold file:bg-blue-100 file:text-blue-800 dark:file:bg-blue-900 dark:file:text-blue-200 hover:file:bg-blue-200 dark:hover:file:bg-blue-800"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 dark:focus:ring-blue-500 disabled:bg-blue-300 dark:disabled:bg-blue-800 dark:disabled:text-blue-100"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Добавление...
                </>
              ) : (
                <>
                  <PlusIcon className="-ml-1 mr-3 h-5 w-5" />
                  Добавить
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {result && (
        <div className="mt-4">
          {result.message && <SuccessText>{result.message}</SuccessText>}
          {result.error && <ErrorText>{result.error}</ErrorText>}
          {result.barcode && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800 font-medium">Штрих-код товара:</p>
              <Barcode
                value={result.barcode}
                height={80}
                width={1.5}
                fontSize={16}
                margin={10}
                className="max-w-full"
                textMargin={5}
                id={`barcode-${result.barcode}`}
              />
              <p className="text-blue-700 mt-1">
                {barcodeDownloaded ? (
                  "Штрихкод был автоматически скачан."
                ) : (
                  <>
                    Если загрузка не началась, нажмите{" "}
                    <button
                      onClick={() => downloadBarcode(result.barcode!)}
                      className="text-blue-600 underline font-medium hover:text-blue-800"
                    >
                      здесь
                    </button>{" "}
                    для скачивания.
                  </>
                )}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
