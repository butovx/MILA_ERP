import { Pool } from "pg";

// Используем DATABASE_URL для подключения, как определено в docker-compose.yml
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "Переменная окружения DATABASE_URL не установлена. Убедитесь, что она задана в вашем .env файле или в среде выполнения.",
  );
}

const pool = new Pool({
  connectionString: connectionString,
  // Опционально: добавьте другие настройки пула, если необходимо
  // ssl: {
  //   rejectUnauthorized: false // Может потребоваться для некоторых облачных баз данных
  // }
});

export default pool;
