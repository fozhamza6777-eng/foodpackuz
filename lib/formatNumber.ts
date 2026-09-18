/**
 * Sonni ming xonalarga bo'lib formatlaydi (masalan 39000 -> "39 000").
 *
 * `Number.prototype.toLocaleString("uz-UZ")` ISHLATILMAYDI — chunki
 * "uz-UZ" lokali uchun ICU (raqam formatlash) ma'lumotlari server (Node.js)
 * va brauzer (masalan Chrome) o'rtasida farq qiladi: server "39 000"
 * (bo'linmas probel bilan) qaytarsa, brauzer "39,000" (vergul bilan)
 * qaytarishi mumkin. Bu farq Next.js'ning server-rendered HTML'i bilan
 * client tomonidagi qayta render qilingan natija bir xil emasligini
 * anglatadi va "hydration mismatch" xatosiga olib keladi. Shu sababli
 * bu yerda oddiy, server va brauzerda har doim bir xil natija beradigan
 * qo'lda formatlash ishlatiladi.
 */
export function formatNumber(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
