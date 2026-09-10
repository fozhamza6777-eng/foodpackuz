export interface Product {
  id: string;
  name: string;
  categories: string[];
  price: number;
  oldPrice?: number;
  isNew?: boolean;
  unit: string;
  packSize: number;
  image: string;
  imageUrl?: string;
  badges: string[];
  material: string;
  sizes: string[];
  description: string;
  code: string;
  infoBadgeType?: "low_stock" | "ships_in" | "imported" | "manufacturing";
  infoBadgeText?: string;
}

export interface CartItem {
  product: Product;
  qty: number;
}
