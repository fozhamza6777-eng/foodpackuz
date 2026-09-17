import ProductArt from "./ProductArt";

export default function ProductImage({
  imageUrl,
  art,
  className,
  fit = "cover"
}: {
  imageUrl?: string | null;
  art: string;
  className?: string;
  /** "cover" — mavjud xatti-harakat (kvadrat qirqib to'ldiradi). "contain" —
   *  rasm to'liq, qirqilmasdan ko'rinadi (admin panelda tekshirish uchun). */
  fit?: "cover" | "contain";
}) {
  if (imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={imageUrl}
        alt=""
        className={`${className ?? "w-full h-full"} ${fit === "contain" ? "object-contain" : "object-cover"} rounded-lg`}
        loading="lazy"
      />
    );
  }
  return <ProductArt art={art} className={className} />;
}
