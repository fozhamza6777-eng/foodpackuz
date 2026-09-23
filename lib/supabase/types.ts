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
  name_ru: string | null;
  sort_order: number;
  is_active: boolean;
  image_url: string | null;
  created_at: string;
}

export interface ProductRow {
  id: string;
  name: string;
  name_ru: string | null;
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
  description_ru: string | null;
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
  tag_ru: string | null;
  title: string;
  title_ru: string | null;
  description: string;
  description_ru: string | null;
  cta_label: string;
  cta_label_ru: string | null;
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
  crm_lead_id: number | null;
  crm_synced_at: string | null;
  created_at: string;
}

export interface CrmAmocrmSettingsRow {
  id: number;
  subdomain: string | null;
  client_id: string | null;
  client_secret: string | null;
  redirect_uri: string | null;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  is_connected: boolean;
  auto_sync_orders: boolean;
  chat_widget_script: string | null;
  webhook_secret: string;
  oauth_state: string | null;
  status_mapping: Record<string, { pipeline_id: number; status_id: number } | undefined>;
  updated_at: string;
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

export interface SupportMessageRow {
  id: string;
  user_id: string;
  sender_role: "customer" | "admin";
  body: string;
  is_read_by_admin: boolean;
  created_at: string;
}

export interface ErrorLogRow {
  id: string;
  source: "client" | "server";
  message: string;
  stack: string | null;
  url: string | null;
  user_agent: string | null;
  extra: Record<string, unknown> | null;
  resolved: boolean;
  created_at: string;
}

export interface TrustedLogoRow {
  id: string;
  type: "partner" | "customer";
  name: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
