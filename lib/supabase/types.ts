export interface ProfileRow {
  id: string;
  full_name: string;
  phone: string;
  company_name: string | null;
  is_admin: boolean;
  avatar_url: string | null;
  birth_date: string | null;
  gender: string | null;
  accepted_offer_at: string | null;
  created_at: string;
}

export interface CategoryRow {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  image_url: string | null;
  created_at: string;
}

export interface ProductRow {
  id: string;
  name: string;
  category: string;
  categories: string[];
  price: number;
  old_price: number | null;
  is_new: boolean;
  unit: string;
  pack_size: number;
  carton_size: number | null;
  image: string;
  image_url: string | null;
  badges: string[];
  material: string;
  sizes: string[];
  description: string;
  code: string;
  is_active: boolean;
  sort_order: number;
  info_badge_type: string | null;
  info_badge_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface BannerRow {
  id: string;
  tag: string;
  title: string;
  description: string;
  cta_label: string;
  cta_href: string;
  image_url: string | null;
  gradient_from: string;
  gradient_to: string;
  art: string;
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
  cancel_reason: string | null;
  payment_method: string;
  payment_receipt_path: string | null;
  payment_status: string;
  created_at: string;
}

export interface BulkRequestRow {
  id: string;
  company: string;
  phone: string;
  volume: string;
  created_at: string;
}

export interface PaymentCardRow {
  id: string;
  bank_name: string | null;
  card_holder: string | null;
  card_number: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}
