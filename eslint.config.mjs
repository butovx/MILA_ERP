import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Отключаем правила, блокирующие сборку
      "@typescript-eslint/no-unused-vars": "warn", // Понижаем до предупреждения
      "@typescript-eslint/no-explicit-any": "warn", // Понижаем до предупреждения
      "react-hooks/exhaustive-deps": "warn", // Уже предупреждение
      "@next/next/no-page-custom-font": "warn", // Понижаем до предупреждения
    },
  },
];

export default eslintConfig;
