export interface Product {
  id: string;
  name: string;
  nameRu?: string;
  categories: string[];
  price: number;
  oldPrice?: number;
  isNew?: boolean;
  unit: string;
  packSize: number;
  cartonSize?: number;
  image: string;
  imageUrl?: string;
  /** Galereya (4 tagacha rasm). Bo'sh bo'lsa, faqat `imageUrl` ishlatiladi. */
  images?: string[];
  badges: string[];
  material: string;
  sizes: string[];
  description: string;
  descriptionRu?: string;
  code: string;
  infoBadgeType?: "low_stock" | "ships_in" | "imported" | "manufacturing";
  infoBadgeText?: string;
  /** Shu mahsulot qaysi asosiy mahsulot kartochkasining o'lchami ekanini bildiradi. */
  variantOf?: string;
  /** O'lcham tugmasidagi yozuv (bo'lmasa `sizes[0]` ishlatiladi). */
  variantLabel?: string;
  /** Faqat katalog kartochkasi uchun: shu kartochkadagi barcha o'lchamlar (asosiy mahsulotning
   *  o'zi ham ichida). Ichidagi mahsulotlarda `variants` bo'lmaydi — savatga ham shular tushadi. */
  variants?: Product[];
}

export interface CartItem {
  product: Product;
  qty: number;
}
