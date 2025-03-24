import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Объединяет классы Tailwind CSS с помощью clsx и tailwind-merge.
 * Это позволяет правильно объединять классы, избегая конфликтов
 * и автоматически разрешая переопределения.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
