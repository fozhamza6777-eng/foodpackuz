export interface ProfileRow {
  id: string;
  full_name: string;
  phone: string;
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
  items: OrderItem[];
  total: number;
  address: string | null;
  note: string | null;
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
