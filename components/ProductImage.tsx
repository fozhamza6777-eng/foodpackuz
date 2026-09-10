import ProductArt from "./ProductArt";

export default function ProductImage({
  imageUrl,
  art,
  className
}: {
  imageUrl?: string | null;
  art: string;
  className?: string;
}) {
  if (imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={imageUrl}
        alt=""
        className={`${className ?? "w-full h-full"} object-cover rounded-lg`}
        loading="lazy"
      />
    );
  }
  return <ProductArt art={art} className={className} />;
}
