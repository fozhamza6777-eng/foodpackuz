"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Matn/kod bloki + "Nusxalash" tugmasi. */
export default function CopyBox({
  value,
  label,
  copyLabel = "Nusxalash",
  copiedLabel = "Nusxalandi"
}: {
  value: string;
  label?: string;
  copyLabel?: string;
  copiedLabel?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Brauzer ruxsat bermasa — foydalanuvchi matnni qo'lda belgilab nusxalaydi.
    }
  };

  return (
    <div>
      {label && <p className="text-xs font-bold uppercase tracking-wide text-ink/45 mb-1.5">{label}</p>}
      <div className="relative">
        <pre className="bg-ink text-white/90 rounded-xl p-4 pr-24 text-[13px] leading-relaxed font-mono overflow-x-auto whitespace-pre-wrap break-all">
          {value}
        </pre>
        <button
          type="button"
          onClick={copy}
          className="absolute top-2.5 right-2.5 flex items-center gap-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-2.5 py-1.5 rounded-lg transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? copiedLabel : copyLabel}
        </button>
      </div>
    </div>
  );
}
