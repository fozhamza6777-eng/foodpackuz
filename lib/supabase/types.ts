export interface ProfileRow {
  id: string;
  full_name: string;
  phone: string;
  company_name: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface ProductRow {
  id: string;
  name: string;
  category: string;
  price: number;
  old_price: number | null;
  is_new: boolean;
  unit: string;
  pack_size: number;
  image: string;
  badges: string[];
  material: string;
  sizes: string[];
  description: string;
  code: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BranchRow {
  id: string;
  user_id: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  unit: string;
}

export interface OrderRow {
  id: string;
  user_id: string;
  branch_id: string | null;
  branch_name: string | null;
  items: OrderItem[];
  total: number;
  address: string | null;
  note: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  created_at: string;
}

export interface BulkRequestRow {
  id: string;
  company: string;
  phone: string;
  volume: string;
  created_at: string;
}
