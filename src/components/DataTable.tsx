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
    <div className={`overflow-x-auto ${className}`}>
      {/* Десктопная версия */}
      <div className="hidden md:block">
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
                <tr
                  key={index}
                  className={`hover:bg-gray-50 ${
                    onRowClick ? "cursor-pointer" : ""
                  }`}
                  onClick={() => onRowClick && onRowClick(item)}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-3 py-2 whitespace-normal"
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
          <div className="text-center text-gray-500 py-4">{emptyMessage}</div>
        ) : (
          <div className="space-y-2">
            {data.map((item, index) => (
              <div
                key={index}
                className={`bg-white rounded-lg shadow p-3 ${
                  onRowClick ? "cursor-pointer" : ""
                }`}
                onClick={() => onRowClick && onRowClick(item)}
              >
                {/* Основная информация */}
                <div className="space-y-1">
                  {primaryColumns.map((column) => (
                    <div
                      key={column.key}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="text-xs font-medium text-gray-500">
                        {column.header}:
                      </span>
                      <span className="text-xs text-gray-900 ml-2">
                        {column.render(item)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Дополнительная информация */}
                {secondaryColumns.length > 0 && (
                  <>
                    <button
                      onClick={() =>
                        setExpandedRow(expandedRow === index ? null : index)
                      }
                      className="mt-2 text-xs text-primary-600 hover:text-primary-800"
                    >
                      {expandedRow === index ? "Скрыть" : "Показать больше"}
                    </button>
                    {expandedRow === index && (
                      <div className="mt-1 pt-1 border-t border-gray-200 space-y-1">
                        {secondaryColumns.map((column) => (
                          <div
                            key={column.key}
                            className="flex justify-between items-center"
                          >
                            <span className="text-xs font-medium text-gray-500">
                              {column.header}:
                            </span>
                            <span className="text-xs text-gray-900 ml-2">
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
