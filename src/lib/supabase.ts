import { createClient } from "@supabase/supabase-js";

// Используем переменные окружения для URL и ключа Supabase
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Проверка наличия переменных окружения в режиме разработки
if (!supabaseUrl || !supabaseKey) {
  console.warn(
    "NEXT_PUBLIC_SUPABASE_URL или NEXT_PUBLIC_SUPABASE_ANON_KEY не определены"
  );
}

// Настройка обхода проверки SSL
// Установка переменной окружения NODE_TLS_REJECT_UNAUTHORIZED
if (typeof process !== "undefined") {
  // Это выполнится только на сервере
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

// Создаем клиент Supabase с дополнительными опциями
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
  },
});

export default supabase;
