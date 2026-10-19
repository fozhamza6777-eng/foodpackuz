-- AI agent orqali buyurtma berish va AI kalitlar butunlay olib tashlandi (0022 bekor qilinadi).
-- Qolgan faqat ochiq (kalitsiz) katalog API'si va MCP serveri — ular bazaga yozmaydi.
--
-- O'chirishdan oldin tekshirilgan: agent_api_keys, agent_orders va source <> 'web' buyurtmalar — hammasi 0 ta edi.

-- orders: "AI" belgisi ustunlari va himoya triggeri
drop trigger if exists orders_protect_source on public.orders;
drop function if exists public.orders_protect_source();
alter table public.orders drop constraint if exists orders_source_check;
alter table public.orders drop column if exists agent_name;
alter table public.orders drop column if exists source;

-- buyurtma so'rovlari (agent_api_keys'ga bog'liq — avval shu)
drop table if exists public.agent_orders;

-- kalitlar
drop trigger if exists agent_api_keys_guard on public.agent_api_keys;
drop function if exists public.agent_api_keys_guard();
drop function if exists public.create_agent_api_key(text, text, text);
drop table if exists public.agent_api_keys;
