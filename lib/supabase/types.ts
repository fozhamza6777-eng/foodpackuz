export interface ProfileRow {
  id: string;
  full_name: string;
  phone: string;
  company_name: string | null;
  created_at: string;
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
