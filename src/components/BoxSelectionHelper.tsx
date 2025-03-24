import { BoxItem } from "@/types";
import { useState, useEffect, useCallback, useRef } from "react";

type UseBoxSelectionProps = {
  items: BoxItem[];
  onSelectionChange: (selectedIds: number[]) => void;
};

/**
 * Хук для работы с выбором элементов в коробке
 * Реализует множественный выбор товаров для удаления из коробки
 */
export default function useBoxSelection({
  items,
  onSelectionChange,
}: UseBoxSelectionProps) {
  // Используем product_id вместо id для надежной идентификации товаров
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [allSelected, setAllSelected] = useState(false);

  // Используем useRef для отслеживания предыдущего состояния
  const prevItemsRef = useRef<BoxItem[]>([]);
  const prevSelectedIdsRef = useRef<number[]>([]);
  // Сохраняем onSelectionChange в ref, чтобы избежать проблем с зависимостями
  const onSelectionChangeRef = useRef(onSelectionChange);

  // При изменении функции колбэка обновляем ref
  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);

  // При изменении списка элементов сбрасываем выбор
  useEffect(() => {
    // Проверяем, изменился ли список элементов
    const prevItems = prevItemsRef.current;
    const itemsChanged =
      items.length !== prevItems.length ||
      items.some(
        (item, index) =>
          !prevItems[index] || prevItems[index].product_id !== item.product_id
      );

    if (itemsChanged) {
      setSelectedIds([]);
      setAllSelected(false);
      prevItemsRef.current = [...items];
    }
  }, [items]);

  // Передаем выбранные элементы наверх только при действительном изменении
  useEffect(() => {
    // Проверяем, изменились ли выбранные элементы
    const prevSelectedIds = prevSelectedIdsRef.current;
    const hasChanged =
      selectedIds.length !== prevSelectedIds.length ||
      selectedIds.some((id, index) => prevSelectedIds[index] !== id);

    if (hasChanged) {
      // Обновляем ref перед вызовом колбэка
      prevSelectedIdsRef.current = [...selectedIds];
      // Используем текущее значение из ref
      onSelectionChangeRef.current(selectedIds);

      // Обновляем состояние allSelected
      setAllSelected(items.length > 0 && selectedIds.length === items.length);
    }
  }, [selectedIds, items.length]);

  // Выбор/снятие выбора с отдельного элемента
  const toggleItemSelection = useCallback((productId: number) => {
    setSelectedIds((prev) => {
      // Если элемент уже выбран - снимаем выделение
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      } else {
        // Добавляем элемент к уже выбранным (множественный выбор)
        return [...prev, productId];
      }
    });
  }, []);

  // Выбор/снятие выбора со всех элементов
  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      // Снимаем выбор со всех элементов
      setSelectedIds([]);
    } else {
      // Выбираем все элементы, используя product_id
      const allIds = items.map((item) => item.product_id);
      setSelectedIds(allIds);
    }
  }, [allSelected, items]);

  // Рендерим чекбоксы для выбора
  const renderSelectionColumn = {
    key: "select",
    header: (
      <div className="flex items-center justify-center">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={toggleSelectAll}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          aria-label="Выбрать все товары"
        />
      </div>
    ),
    render: (item: BoxItem) => (
      <div className="flex items-center justify-center">
        <input
          type="checkbox"
          checked={selectedIds.includes(item.product_id)}
          onChange={() => toggleItemSelection(item.product_id)}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          aria-label={`Выбрать товар ${item.name || "без имени"}`}
        />
      </div>
    ),
    mobilePriority: 1,
  };

  return { selectedIds, allSelected, renderSelectionColumn };
}
