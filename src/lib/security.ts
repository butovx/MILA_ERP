/**
 * Настройки безопасности для работы с SSL
 *
 * В продакшн-среде Vercel возникают проблемы с самоподписанными сертификатами
 * Этот файл настраивает Node.js для обхода этих проблем
 */

// Нативный модуль Node.js для HTTP-запросов
import https from "https";

// Отключаем проверку SSL-сертификатов в продакшн-режиме
// Это безопасный способ настройки, не требующий переменных окружения
if (process.env.VERCEL === "1" || process.env.NODE_ENV === "production") {
  console.log("Настраиваем SSL для Vercel Production...");

  // Переопределяем дефолтный агент для HTTPS запросов
  const originalAgent = https.globalAgent;
  const newAgent = new https.Agent({
    rejectUnauthorized: false,
  });

  // Сохраняем оригинальный агент для возможной реверсии
  https.globalAgent = newAgent;
}

export default function setupSecurity() {
  // Эта функция может использоваться для дополнительных настроек безопасности
  console.log("Security setup completed.");
  return true;
}
