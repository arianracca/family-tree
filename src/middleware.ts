import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    // Rutas con locale
    "/(es|it|en)/:path*",
    // Raíz — para redirigir / → /es
    "/",
    // Excluir api, _next, archivos estáticos
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};