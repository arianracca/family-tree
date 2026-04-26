import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = (await requestLocale) ?? routing.defaultLocale;

  const messages = await (
    locale === "it" ? import("../messages/it.json") :
    locale === "en" ? import("../messages/en.json") :
                      import("../messages/es.json")
  );

  return {
    locale,
    messages: messages.default,
  };
});