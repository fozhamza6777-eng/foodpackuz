"use client";

type ArtKey = "clamshell" | "cup" | "pizza" | "deli" | "bag" | "cutlery" | "sauce" | "thermo";

export default function ProductArt({ art, className }: { art: string; className?: string }) {
  const key = art as ArtKey;
  const common = className ?? "w-full h-full";

  switch (key) {
    case "clamshell":
      return (
        <svg viewBox="0 0 200 160" className={common} fill="none">
          <path d="M20 90 h160 v50 a8 8 0 0 1-8 8H28a8 8 0 0 1-8-8Z" fill="#EADFC0" stroke="#241C15" strokeWidth="3" />
          <path d="M20 90 C20 55 45 38 100 38 C155 38 180 55 180 90Z" fill="#F3E9CF" stroke="#241C15" strokeWidth="3" />
          <path d="M20 90h160" stroke="#241C15" strokeWidth="3" />
          <path d="M60 90c4-14 12-22 40-22s36 8 40 22" stroke="#C9AF7C" strokeWidth="2" strokeDasharray="4 5" />
        </svg>
      );
    case "cup":
      return (
        <svg viewBox="0 0 200 160" className={common} fill="none">
          <path d="M62 30h76l-10 108a10 10 0 0 1-10 9H82a10 10 0 0 1-10-9Z" fill="#F3E9CF" stroke="#241C15" strokeWidth="3" />
          <ellipse cx="100" cy="30" rx="38" ry="10" fill="#EADFC0" stroke="#241C15" strokeWidth="3" />
          <path d="M70 55h60M74 80h52M78 105h44" stroke="#C9AF7C" strokeWidth="2" strokeDasharray="3 5" />
        </svg>
      );
    case "pizza":
      return (
        <svg viewBox="0 0 200 160" className={common} fill="none">
          <rect x="20" y="34" width="160" height="98" rx="4" fill="#F3E9CF" stroke="#241C15" strokeWidth="3" />
          <path d="M20 34h160" stroke="#241C15" strokeWidth="3" />
          <circle cx="100" cy="83" r="34" fill="#EADFC0" stroke="#C9AF7C" strokeWidth="2" strokeDasharray="4 5" />
          <circle cx="88" cy="75" r="4" fill="#B5222A" />
          <circle cx="112" cy="86" r="4" fill="#B5222A" />
          <circle cx="96" cy="98" r="4" fill="#B5222A" />
          <circle cx="42" cy="18" r="3" fill="#241C15" />
          <circle cx="158" cy="18" r="3" fill="#241C15" />
        </svg>
      );
    case "deli":
      return (
        <svg viewBox="0 0 200 160" className={common} fill="none">
          <rect x="30" y="55" width="140" height="80" rx="10" fill="#F3E9CF" stroke="#241C15" strokeWidth="3" />
          <path d="M30 55c0-8 6-14 14-14h112c8 0 14 6 14 14" fill="none" stroke="#241C15" strokeWidth="3" />
          <path d="M46 41V27M100 41V27M154 41V27" stroke="#241C15" strokeWidth="3" strokeLinecap="round" />
          <path d="M50 90h100M50 108h100" stroke="#C9AF7C" strokeWidth="2" strokeDasharray="4 5" />
        </svg>
      );
    case "bag":
      return (
        <svg viewBox="0 0 200 160" className={common} fill="none">
          <path d="M45 55h110l8 80H37Z" fill="#F3E9CF" stroke="#241C15" strokeWidth="3" />
          <path d="M75 55V40a25 25 0 0 1 50 0v15" stroke="#241C15" strokeWidth="3" fill="none" />
          <path d="M45 55h110" stroke="#241C15" strokeWidth="3" />
          <path d="M55 80h90M60 100h80" stroke="#C9AF7C" strokeWidth="2" strokeDasharray="4 5" />
        </svg>
      );
    case "cutlery":
      return (
        <svg viewBox="0 0 200 160" className={common} fill="none">
          <path d="M70 20v55c0 8 6 14 10 14v66" stroke="#241C15" strokeWidth="3" strokeLinecap="round" />
          <path d="M60 20v30M70 20v30M80 20v30" stroke="#241C15" strokeWidth="3" strokeLinecap="round" />
          <path d="M130 20c-16 0-16 30-6 40s16 4 16 4v91" stroke="#241C15" strokeWidth="3" strokeLinecap="round" fill="none" />
        </svg>
      );
    case "sauce":
      return (
        <svg viewBox="0 0 200 160" className={common} fill="none">
          <path d="M70 60h60l6 62a10 10 0 0 1-10 10H74a10 10 0 0 1-10-10Z" fill="#F3E9CF" stroke="#241C15" strokeWidth="3" />
          <rect x="66" y="46" width="68" height="16" rx="4" fill="#EADFC0" stroke="#241C15" strokeWidth="3" />
          <path d="M80 85h40" stroke="#C9AF7C" strokeWidth="2" strokeDasharray="4 5" />
        </svg>
      );
    case "thermo":
      return (
        <svg viewBox="0 0 200 160" className={common} fill="none">
          <rect x="35" y="35" width="130" height="100" rx="12" fill="#F3E9CF" stroke="#241C15" strokeWidth="3" />
          <rect x="35" y="35" width="130" height="26" rx="8" fill="#EADFC0" stroke="#241C15" strokeWidth="3" />
          <path d="M100 75c-14 16-14 24 0 36 14-12 14-20 0-36Z" fill="#FF5A1F" opacity="0.85" />
        </svg>
      );
    default:
      return null;
  }
}
