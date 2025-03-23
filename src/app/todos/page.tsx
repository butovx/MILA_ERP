"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Todo {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  created_at?: string;
}

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Состояние для новой задачи
  const [newTodo, setNewTodo] = useState({
    title: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Загрузка списка задач
  const fetchTodos = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/todos");

      if (!response.ok) {
        throw new Error("Не удалось загрузить список задач");
      }

      const data = await response.json();
      setTodos(data);
    } catch (err: any) {
      console.error("Ошибка при загрузке задач:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    fetchTodos();
  }, []);

  // Добавление новой задачи
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTodo.title.trim()) return;

    try {
      setSubmitting(true);

      const response = await fetch("/api/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTodo),
      });

      if (!response.ok) {
        throw new Error("Не удалось создать задачу");
      }

      // Очищаем форму
      setNewTodo({ title: "", description: "" });

      // Перезагружаем список задач
      fetchTodos();
    } catch (err: any) {
      console.error("Ошибка при создании задачи:", err);
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Изменение статуса задачи
  const toggleTodoStatus = async (todo: Todo) => {
    try {
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ completed: !todo.completed }),
      });

      if (!response.ok) {
        throw new Error("Не удалось обновить статус задачи");
      }

      // Обновляем список задач
      fetchTodos();
    } catch (err: any) {
      console.error("Ошибка при обновлении задачи:", err);
      alert(err.message);
    }
  };

  // Удаление задачи
  const deleteTodo = async (id: number) => {
    if (!confirm("Вы уверены, что хотите удалить эту задачу?")) {
      return;
    }

    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Не удалось удалить задачу");
      }

      // Обновляем список задач
      fetchTodos();
    } catch (err: any) {
      console.error("Ошибка при удалении задачи:", err);
      alert(err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Список задач</h1>

      {/* Форма добавления задачи */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Добавить новую задачу</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Название
            </label>
            <input
              type="text"
              id="title"
              value={newTodo.title}
              onChange={(e) =>
                setNewTodo({ ...newTodo, title: e.target.value })
              }
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Описание
            </label>
            <textarea
              id="description"
              value={newTodo.description}
              onChange={(e) =>
                setNewTodo({ ...newTodo, description: e.target.value })
              }
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              rows={3}
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !newTodo.title.trim()}
            className="inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
          >
            {submitting ? "Добавление..." : "Добавить задачу"}
          </button>
        </form>
      </div>

      {/* Список задач */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h2 className="text-xl font-semibold p-6 border-b">Задачи</h2>

        {loading ? (
          <div className="p-6 text-center">
            <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            <p className="mt-2 text-gray-600">Загрузка задач...</p>
          </div>
        ) : error ? (
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
              <strong className="font-bold">Ошибка: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          </div>
        ) : todos.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Нет задач. Добавьте новую задачу выше.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {todos.map((todo) => (
              <li key={todo.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => toggleTodoStatus(todo)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="ml-3">
                      <p
                        className={`text-sm font-medium ${
                          todo.completed
                            ? "line-through text-gray-500"
                            : "text-gray-900"
                        }`}
                      >
                        {todo.title}
                      </p>
                      {todo.description && (
                        <p className="text-sm text-gray-500">
                          {todo.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="text-red-600 hover:text-red-900 ml-4 text-sm"
                  >
                    Удалить
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Навигация назад */}
      <div className="mt-6">
        <Link href="/" className="text-blue-600 hover:text-blue-800">
          &larr; На главную
        </Link>
      </div>
    </div>
  );
}
