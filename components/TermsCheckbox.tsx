"use client";

import { useLanguage } from "./LanguageProvider";

export default function TermsCheckbox({
  checked,
  onChange
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const { t } = useLanguage();

  return (
    <label className="flex items-start gap-2.5 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 mt-0.5 accent-brand-500 shrink-0"
        required
      />
      <span className="text-xs text-ink/60 font-medium leading-relaxed">
        {t("auth.accept_terms_prefix")}{" "}
        <a
          href="/oferta"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-brand-600 font-bold hover:underline"
        >
          {t("auth.accept_terms_link")}
        </a>{" "}
        {t("auth.accept_terms_suffix")}
      </span>
    </label>
  );
}
