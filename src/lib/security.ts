/**
 * Настройки безопасности для работы с SSL
 *
 * В продакшн-среде Vercel возникают проблемы с самоподписанными сертификатами
 * Этот файл настраивает Node.js для обхода этих проблем
 */

// Отключаем проверку SSL-сертификатов только в продакшн-среде Vercel
if (process.env.VERCEL === "1" || process.env.NODE_ENV === "production") {
  console.log("Отключаем проверку SSL-сертификатов для Vercel Production...");
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

export default function setupSecurity() {
  // Эта функция может использоваться для дополнительных настроек безопасности
  console.log("Security setup completed.");
  return true;
}
