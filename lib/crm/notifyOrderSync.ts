/** Buyurtma yaratilgan/holati o'zgargandan so'ng chaqiriladi — server
 *  route amoCRM ulanmagan bo'lsa jim o'zini o'chiradi, shuning uchun bu
 *  chaqiruv amoCRM sozlanmagan bo'lsa ham xavfsiz (hech narsaga ta'sir
 *  qilmaydi). Xatolik chiqsa ham buyurtma oqimini to'xtatmaslik uchun
 *  natija kutilmaydi va xatolik yutiladi. */
export function notifyOrderSync(orderId: string): void {
  fetch("/api/crm/amocrm/order-sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId })
  }).catch(() => {});
}
