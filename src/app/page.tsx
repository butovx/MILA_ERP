"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RedirectToHome() {
  const router = useRouter();

  useEffect(() => {
    router.push("/home");
  }, [router]);

  return (
    <div className="py-8 text-center">
      <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      <p className="mt-2 text-gray-600">
        Перенаправление на главную страницу...
      </p>
    </div>
  );
}
