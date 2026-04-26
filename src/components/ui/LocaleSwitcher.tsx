"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { routing } from "@/i18n/routing";

const LOCALE_LABELS: Record<string, string> = {
  es: "ES",
  it: "IT",
  en: "EN",
};

export default function LocaleSwitcher() {
  const locale   = useLocale();
  const router   = useRouter();
  const pathname = usePathname();

  function handleChange(next: string) {
    // Reemplaza solo el segmento de locale en la URL actual
    // /es/tree → /it/tree
    const segments = pathname.split("/");
    segments[1] = next;
    router.push(segments.join("/"));
  }

  return (
    <div style={{ display: "flex", gap: "4px" }}>
      {routing.locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => handleChange(l)}
          disabled={l === locale}
          aria-label={`Switch to ${l}`}
          aria-current={l === locale ? "true" : undefined}
        >
          {LOCALE_LABELS[l]}
        </button>
      ))}
    </div>
  );
}