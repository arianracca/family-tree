import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales:       ["es", "it", "en"],
  defaultLocale: "es",
  localePrefix:  "always",
});