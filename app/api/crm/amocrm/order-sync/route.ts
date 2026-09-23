import { NextRequest, NextResponse } from "next/server";
import { getServiceClient, isServiceClientConfigured } from "@/lib/supabase/service";
import { createLeadForOrder, getValidAccessToken, updateLeadStage } from "@/lib/amocrm/api";
import type { CrmAmocrmSettingsRow, OrderRow, ProfileRow } from "@/lib/supabase/types";

// Yangi buyurtma yaratilganda yoki uning holati o'zgarganda (mijoz yoki
// admin tomonidan) chaqiriladi — CartDrawer.tsx, OrdersTab.tsx va
// ProfileDrawer.tsx shu route'ga fire-and-forget so'rov jo'natadi.
// amoCRM ulanmagan bo'lsa yoki avto-sinxronizatsiya o'chirilgan bo'lsa,
// hech narsa qilmasdan jim qaytadi (sayt ishlashiga xalaqit bermaslik uchun).
export async function POST(req: NextRequest) {
  if (!isServiceClientConfigured) {
    return NextResponse.json({ ok: true, skipped: "server_not_configured" });
  }

  let orderId: string | undefined;
  try {
    const body = await req.json();
    orderId = body?.orderId;
  } catch {
    return NextResponse.json({ ok: false, message: "Noto'g'ri so'rov" }, { status: 400 });
  }
  if (!orderId) {
    return NextResponse.json({ ok: false, message: "orderId kerak" }, { status: 400 });
  }

  const db = getServiceClient();

  const { data: settingsData } = await db.from("crm_amocrm_settings").select("*").eq("id", 1).single();
  const settings = settingsData as CrmAmocrmSettingsRow | null;

  if (!settings || !settings.is_connected || !settings.auto_sync_orders) {
    return NextResponse.json({ ok: true, skipped: "not_connected" });
  }

  const { data: orderData } = await db.from("orders").select("*").eq("id", orderId).single();
  const order = orderData as OrderRow | null;
  if (!order) {
    return NextResponse.json({ ok: false, message: "Buyurtma topilmadi" }, { status: 404 });
  }

  try {
    const { accessToken, subdomain } = await getValidAccessToken(db, settings);
    const pipeline = settings.status_mapping[order.status];

    if (!order.crm_lead_id) {
      const { data: profileData } = await db
        .from("profiles")
        .select("full_name, phone")
        .eq("id", order.user_id)
        .single();
      const profile = profileData as Pick<ProfileRow, "full_name" | "phone"> | null;

      const leadId = await createLeadForOrder(
        subdomain,
        accessToken,
        order,
        { name: profile?.full_name ?? "", phone: profile?.phone ?? null },
        pipeline
      );

      await db
        .from("orders")
        .update({ crm_lead_id: leadId, crm_synced_at: new Date().toISOString() })
        .eq("id", order.id);

      return NextResponse.json({ ok: true, leadId });
    }

    if (pipeline) {
      await updateLeadStage(subdomain, accessToken, order.crm_lead_id, pipeline);
    }
    await db.from("orders").update({ crm_synced_at: new Date().toISOString() }).eq("id", order.id);

    return NextResponse.json({ ok: true, leadId: order.crm_lead_id });
  } catch (err) {
    console.error("[amoCRM] order-sync xatosi:", err);
    return NextResponse.json({ ok: false, message: "amoCRM sinxronizatsiya xatosi" }, { status: 502 });
  }
}
