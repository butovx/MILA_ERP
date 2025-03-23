export interface Product {
  id: number;
  name: string;
  barcode: string;
  photo_paths?: string[];
  quantity?: number;
  description?: string;
  price?: number;
  category?: string;
  boxes?: Box[];
}

export interface Box {
  id: number;
  name: string;
  barcode: string;
}

export interface BoxItem extends Product {
  quantity: number;
  product_id: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Добавляем типы для глобального объекта window
declare global {
  interface Window {
    __THEME_RESOLVED?: "light" | "dark";
    Quagga: any;
  }
}
