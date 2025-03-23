"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface DbStatus {
  success: boolean;
  message: string;
  database?: {
    connected: boolean;
    tables: {
      todos: {
        exists: boolean;
        error: string | null;
      };
      migrations: {
        exists: boolean;
        error: string | null;
      };
    };
  };
  error?: string;
}

export default function DbStatusPage() {
  const [status, setStatus] = useState<DbStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkStatus() {
      try {
        setLoading(true);
        const response = await fetch("/api/db/status");
        const data = await response.json();
        setStatus(data);
      } catch (error) {
        console.error("Ошибка при проверке статуса БД:", error);
        setStatus({
          success: false,
          message: "Ошибка при запросе статуса базы данных",
          error: error instanceof Error ? error.message : "Неизвестная ошибка",
        });
      } finally {
        setLoading(false);
      }
    }

    checkStatus();
  }, []);

  const runMigrations = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/migrations/run");
      const data = await response.json();
      alert(data.message);

      // Перезагружаем статус
      const statusResponse = await fetch("/api/db/status");
      const statusData = await statusResponse.json();
      setStatus(statusData);
    } catch (error) {
      console.error("Ошибка при запуске миграций:", error);
      alert("Ошибка при запуске миграций");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Статус базы данных</h1>
        <Link
          href="/db-admin"
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Админ БД
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center p-6">
          <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      ) : status ? (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
          <div className="p-6">
            <div
              className={`rounded-md p-4 mb-4 ${
                status.success
                  ? "bg-green-50 dark:bg-green-900/30"
                  : "bg-red-50 dark:bg-red-900/30"
              }`}
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  {status.success ? (
                    <svg
                      className="h-5 w-5 text-green-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <h3
                    className={`text-sm font-medium ${
                      status.success
                        ? "text-green-800 dark:text-green-300"
                        : "text-red-800 dark:text-red-300"
                    }`}
                  >
                    {status.message}
                  </h3>
                </div>
              </div>
            </div>

            {status.database && (
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-3">
                  Информация о таблицах
                </h3>
                <div className="space-y-4">
                  <div className="border dark:border-gray-700 rounded-md p-4">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Таблица todos
                    </h4>
                    <div
                      className={`px-3 py-2 rounded-md text-sm ${
                        status.database.tables.todos.exists
                          ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                          : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                      }`}
                    >
                      {status.database.tables.todos.exists
                        ? "Существует"
                        : "Не существует"}
                      {status.database.tables.todos.error && (
                        <p className="mt-1 text-red-600 dark:text-red-400">
                          Ошибка: {status.database.tables.todos.error}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="border dark:border-gray-700 rounded-md p-4">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Таблица миграций
                    </h4>
                    <div
                      className={`px-3 py-2 rounded-md text-sm ${
                        status.database.tables.migrations.exists
                          ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                          : "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                      }`}
                    >
                      {status.database.tables.migrations.exists
                        ? "Существует"
                        : "Не существует"}
                      {status.database.tables.migrations.error && (
                        <p className="mt-1 text-yellow-600 dark:text-yellow-400">
                          Примечание: {status.database.tables.migrations.error}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {status.error && (
              <div className="mt-4 px-3 py-2 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md">
                <p className="text-sm">Ошибка: {status.error}</p>
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
              >
                Проверить снова
              </button>
              <button
                onClick={runMigrations}
                className="inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-300"
              >
                Запустить миграции
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-md">
          <p className="text-red-700 dark:text-red-300">
            Не удалось получить информацию о статусе базы данных
          </p>
        </div>
      )}

      <div className="mt-6">
        <Link
          href="/"
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          &larr; На главную
        </Link>
      </div>
    </div>
  );
}
