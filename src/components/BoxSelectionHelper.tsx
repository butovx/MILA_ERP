import { BoxItem } from "@/types";
import { useState, useEffect, useCallback, useRef } from "react";

type UseBoxSelectionProps = {
  items: BoxItem[];
  onSelectionChange: (selectedIds: number[]) => void;
};

/**
 * Хук для работы с выбором элементов в коробке
 * Решает проблему автоматического выбора всех элементов при активации режима выбора
 */
export default function useBoxSelection({
  items,
  onSelectionChange,
}: UseBoxSelectionProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [allSelected, setAllSelected] = useState(false);

  // Используем useRef для отслеживания предыдущего состояния
  const prevSelectedIdsRef = useRef<number[]>([]);
  // Сохраняем onSelectionChange в ref, чтобы избежать проблем с зависимостями
  const onSelectionChangeRef = useRef(onSelectionChange);

  // При изменении функции колбэка обновляем ref
  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);

  // При изменении списка элементов сбрасываем выбор
  useEffect(() => {
    setSelectedIds([]);
    setAllSelected(false);
  }, [items]);

  // Передаем выбранные элементы наверх только при действительном изменении
  // и проверяем состояние allSelected
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

      // Обновляем состояние allSelected в том же эффекте
      setAllSelected(items.length > 0 && selectedIds.length === items.length);
    }
  }, [selectedIds, items.length]);

  // Выбор/снятие выбора с отдельного элемента
  const toggleItemSelection = useCallback((id: number) => {
    setSelectedIds((prev) => {
      // Если элемент уже выбран - снимаем выделение
      if (prev.includes(id)) {
        return prev.filter((itemId) => itemId !== id);
      } else {
        // Иначе - добавляем только этот элемент (не все)
        return [id];
      }
    });
  }, []);

  // Выбор/снятие выбора со всех элементов
  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      // Снимаем выбор со всех элементов
      setSelectedIds([]);
    } else {
      // Выбираем все элементы
      const allIds = items.map((item) => item.id);
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
        />
      </div>
    ),
    render: (item: BoxItem) => (
      <div className="flex items-center justify-center">
        <input
          type="checkbox"
          checked={selectedIds.includes(item.id)}
          onChange={() => toggleItemSelection(item.id)}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
      </div>
    ),
    mobilePriority: 1,
  };

  return { selectedIds, allSelected, renderSelectionColumn };
}
