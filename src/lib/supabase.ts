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

// Создаем клиент Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
