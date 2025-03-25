import React, { useState } from "react";

interface Column<T> {
  key: string;
  header: string | React.ReactNode;
  render: (item: T) => React.ReactNode;
  mobilePriority?: number; // Приоритет отображения на мобильных устройствах (1 - высший)
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  className?: string;
  onRowClick?: (item: T) => void;
}

export default function DataTable<T>({
  columns,
  data,
  emptyMessage = "Нет данных",
  className = "",
  onRowClick,
}: DataTableProps<T>) {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // Сортируем колонки по приоритету для мобильных устройств
  const sortedColumns = [...columns].sort((a, b) => {
    const priorityA = a.mobilePriority || 999;
    const priorityB = b.mobilePriority || 999;
    return priorityA - priorityB;
  });

  // Основные колонки (высокий приоритет)
  const primaryColumns = sortedColumns.filter(
    (col) => col.mobilePriority && col.mobilePriority <= 2
  );
  // Дополнительные колонки (низкий приоритет)
  const secondaryColumns = sortedColumns.filter(
    (col) => !col.mobilePriority || col.mobilePriority > 2
  );

  return (
    <div className={`w-full ${className}`}>
      {/* Десктопная версия */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-3 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-3 py-2 whitespace-normal text-sm"
                    >
                      {column.render(item)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Мобильная версия */}
      <div className="md:hidden">
        {data.length === 0 ? (
          <div className="text-center text-gray-500 py-4 bg-white rounded-lg shadow-sm">
            {emptyMessage}
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm p-3 sm:p-4 border border-gray-100"
              >
                {/* Основная информация */}
                <div className="flex flex-row items-start gap-3 sm:gap-4">
                  {/* Фотография - показываем только если есть колонка с фото */}
                  {primaryColumns.some((col) => col.key === "photo") && (
                    <div className="flex-shrink-0 w-20 sm:w-28">
                      {primaryColumns
                        .find((col) => col.key === "photo")
                        ?.render(item)}
                    </div>
                  )}

                  {/* Остальные основные данные */}
                  <div className="flex-1 min-w-0 space-y-2">
                    {primaryColumns
                      .filter((column) => column.key !== "photo")
                      .map((column) => (
                        <div key={column.key} className="flex flex-col">
                          <span className="text-xs font-medium text-gray-500 mb-0.5">
                            {column.header}:
                          </span>
                          <span className="text-sm text-gray-900 break-words">
                            {column.render(item)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Дополнительная информация */}
                {secondaryColumns.length > 0 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedRow(expandedRow === index ? null : index);
                      }}
                      className="mt-4 text-xs text-primary-600 hover:text-primary-800 flex items-center min-h-[44px] py-2 px-2 -mx-2 rounded-md active:bg-gray-50"
                    >
                      {expandedRow === index ? "Скрыть" : "Показать больше"}
                    </button>
                    {expandedRow === index && (
                      <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
                        {secondaryColumns.map((column) => (
                          <div key={column.key} className="flex flex-col">
                            <span className="text-xs font-medium text-gray-500 mb-1">
                              {column.header}:
                            </span>
                            <span className="text-sm text-gray-900">
                              {column.render(item)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
