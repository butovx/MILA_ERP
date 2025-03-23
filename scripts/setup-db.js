const { Pool } = require("pg");
require("dotenv").config();

// Определяем конфигурацию подключения к базе данных
let poolConfig = {};

// Проверяем, доступна ли Vercel Postgres
if (process.env.POSTGRES_URL) {
  poolConfig = {
    connectionString: process.env.POSTGRES_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  };
} else if (
  process.env.DB_USER &&
  process.env.DB_HOST &&
  process.env.DB_NAME &&
  process.env.DB_PASSWORD &&
  process.env.DB_PORT
) {
  poolConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT, 10),
  };
} else {
  console.error("Необходимо настроить переменные окружения для базы данных!");
  process.exit(1);
}

const pool = new Pool(poolConfig);

// Функция для создания таблиц
async function createTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        quantity INTEGER,
        barcode VARCHAR(50) UNIQUE,
        photo_paths JSONB DEFAULT '[]',
        description TEXT,
        price DECIMAL(10, 2),
        category VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS boxes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        barcode VARCHAR(50) UNIQUE,
        description TEXT,
        location VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS box_items (
        id SERIAL PRIMARY KEY,
        box_id INTEGER REFERENCES boxes(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_box_product UNIQUE (box_id, product_id)
      );
    `);

    console.log("Таблицы успешно созданы!");
  } catch (error) {
    console.error("Ошибка при создании таблиц:", error);
  } finally {
    await pool.end();
  }
}

createTables();
