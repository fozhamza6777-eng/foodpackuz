-- amoCRM integratsiyasi: buyurtmalarni CRM bilan ikki tomonlama sinxronlash
-- (sayt -> CRM: yangi buyurtma/holat o'zgarishi; CRM -> sayt: amoCRM
-- webhook orqali holat o'zgarishi) va admin panel orqali ulash/sozlash.

alter table orders
  add column if not exists crm_lead_id bigint,
  add column if not exists crm_synced_at timestamptz;

-- Faqat bitta qator bo'ladigan (singleton) sozlamalar jadvali — amoCRM
-- ulanish ma'lumotlari (token'lar, subdomain va h.k.) shu yerda saqlanadi.
-- Bu jadval juda nozik ma'lumot (client_secret, access/refresh token)
-- saqlagani uchun faqat admin (is_admin()) o'qiy/yoza oladi.
create table if not exists crm_amocrm_settings (
  id smallint primary key default 1,
  subdomain text,
  client_id text,
  client_secret text,
  redirect_uri text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  is_connected boolean not null default false,
  auto_sync_orders boolean not null default true,
  chat_widget_script text,
  webhook_secret text not null default encode(gen_random_bytes(16), 'hex'),
  -- OAuth CSRF himoyasi uchun: "Ulash" bosilganda vaqtinchalik yoziladi,
  -- callback'da solishtirilib, keyin tozalanadi.
  oauth_state text,
  -- { "yangi": {"pipeline_id":..,"status_id":..}, "jarayonda": {...}, ... }
  status_mapping jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint crm_amocrm_settings_singleton check (id = 1)
);

insert into crm_amocrm_settings (id) values (1)
  on conflict (id) do nothing;

alter table crm_amocrm_settings enable row level security;

drop policy if exists "crm_amocrm_settings_admin_all" on crm_amocrm_settings;
create policy "crm_amocrm_settings_admin_all"
  on crm_amocrm_settings
  for all
  using (is_admin())
  with check (is_admin());

create or replace function set_crm_amocrm_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_crm_amocrm_settings_updated_at on crm_amocrm_settings;
create trigger trg_crm_amocrm_settings_updated_at
  before update on crm_amocrm_settings
  for each row execute function set_crm_amocrm_settings_updated_at();
