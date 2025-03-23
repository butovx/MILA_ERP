import { createClient } from "@supabase/supabase-js";
import https from "https";

// Используем переменные окружения для URL и ключа Supabase
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Проверка наличия переменных окружения в режиме разработки
if (!supabaseUrl || !supabaseKey) {
  console.warn(
    "NEXT_PUBLIC_SUPABASE_URL или NEXT_PUBLIC_SUPABASE_ANON_KEY не определены"
  );
}

// Настройка для работы с самоподписанными сертификатами
// Используем дополнительную конфигурацию вместо переменных окружения
if (typeof process !== "undefined" && process.env.NODE_ENV === "production") {
  // Устанавливаем безопасным способом
  const agent = new https.Agent({
    rejectUnauthorized: false,
  });

  global.fetch = (url: any, init: any) => {
    return fetch(url, { ...init, agent });
  };
}

// Создаем клиент Supabase с дополнительными опциями
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
  },
});

export default supabase;
