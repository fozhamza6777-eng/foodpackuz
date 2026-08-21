export type Category =
  | "Barchasi"
  | "Klamshell qutilar"
  | "Stakanlar"
  | "Pitsa qutilari"
  | "Salat idishlari"
  | "Kraft paketlar"
  | "Asboblar va sous"
  | "Termo konteynerlar";

export interface Product {
  id: string;
  name: string;
  category: Exclude<Category, "Barchasi">;
  price: number;
  unit: string;
  packSize: number;
  image: string;
  badges: string[];
  material: string;
  sizes: string[];
  description: string;
  code: string;
}

export interface CartItem {
  product: Product;
  qty: number;
}
