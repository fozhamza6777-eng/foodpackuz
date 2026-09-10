import { AlertTriangle, Truck, Plane, Wrench, LucideIcon } from "lucide-react";

interface BadgeConfig {
  icon: LucideIcon;
  className: string;
  defaultText: string;
}

const CONFIG: Record<string, BadgeConfig> = {
  low_stock: {
    icon: AlertTriangle,
    className: "bg-danger/10 text-danger border-danger/20",
    defaultText: "Tugab qolyapti"
  },
  ships_in: {
    icon: Truck,
    className: "bg-brand-50 text-brand-600 border-brand-100",
    defaultText: "Bir necha kunda yetkaziladi"
  },
  imported: {
    icon: Plane,
    className: "bg-purple-50 text-purple-600 border-purple-100",
    defaultText: "Chet eldan olib kelinadi"
  },
  manufacturing: {
    icon: Wrench,
    className: "bg-amber-light text-amber border-amber/30",
    defaultText: "Ishlab chiqarilmoqda"
  }
};

export default function ProductInfoBadge({
  type,
  text,
  className
}: {
  type?: string;
  text?: string;
  className?: string;
}) {
  if (!type || !CONFIG[type]) return null;
  const cfg = CONFIG[type];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold border rounded-md px-2 py-1 ${cfg.className} ${
        className ?? ""
      }`}
    >
      <Icon className="w-3 h-3" /> {text || cfg.defaultText}
    </span>
  );
}
