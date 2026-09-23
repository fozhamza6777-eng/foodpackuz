import { NextResponse } from "next/server";
import { getServiceClient, isServiceClientConfigured } from "@/lib/supabase/service";

// Ommaviy (autentifikatsiyasiz) route — sayt tashrifchilariga amoCRM chat
// vidjeti skriptini beradi. crm_amocrm_settings jadvali RLS bilan faqat
// adminlarga ochiq bo'lgani uchun, shu skriptni butun saytga xavfsiz
// yetkazish uchun service_role kaliti bilan o'qiladi (faqat shu bitta
// ustun qaytariladi, boshqa hech qanday maxfiy ma'lumot chiqmaydi).
export async function GET() {
  if (!isServiceClientConfigured) {
    return NextResponse.json({ script: null });
  }
  const db = getServiceClient();
  const { data } = await db.from("crm_amocrm_settings").select("chat_widget_script").eq("id", 1).single();
  return NextResponse.json({ script: data?.chat_widget_script ?? null });
}
