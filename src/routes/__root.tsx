import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { effectivePixelId, pixelIdValid, pixelScript, track } from "@/lib/pixel";
import { getSiteSettings } from "@/lib/settings.functions";
import { googleAnalyticsScript } from "@/lib/google-analytics";
import { BottomNav } from "@/components/site";
import { Toaster } from "@/components/ui/sonner";
import { VisitorNotice } from "@/components/visitor-notice";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">This car or page isn't here anymore.</p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
            See all cars
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Check your network and try again.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
          >
            Try again
          </button>
          <a href="/" className="inline-flex items-center justify-center rounded-full border border-input bg-background px-5 py-3 text-sm font-semibold text-foreground">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["site-settings"],
      queryFn: () => getSiteSettings(),
      staleTime: 60_000,
    }),
  head: ({ loaderData }) => {
    const id = effectivePixelId(loaderData?.pixelId);
    const adsenseClientId = loaderData?.adsenseClientId ?? "";
    const googleAnalyticsId = loaderData?.googleAnalyticsId ?? "";
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
        { name: "theme-color", content: "#0e5a3a" },
        { name: "google-site-verification", content: "SyAuze3bj8zWdEHygoYCALHQLHkY4SjKB4pGt657tG8" },
        { title: "Rush Autos — Used cars in Abuja" },
        { name: "description", content: "Foreign used (Tokunbo) and Nigerian used cars in Abuja. Inspect before you pay." },
        { property: "og:site_name", content: "Rush Autos" },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(adsenseClientId ? [{ name: "google-adsense-account", content: adsenseClientId }] : []),
      ],
      links: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Instrument+Sans:wght@400;500;600;700&display=swap",
        },
        { rel: "stylesheet", href: appCss },
        { rel: "icon", href: "/ChatGPT%20Image%20Oct%206,%202026,%2007_16_44%20AM.png", type: "image/png" },
      ],
      scripts: [
        ...(pixelIdValid(id) ? [{ children: pixelScript(id) }] : []),
        ...(googleAnalyticsId
          ? [
              {
                children: googleAnalyticsScript(googleAnalyticsId),
              },
              {
                src: `https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`,
                async: true,
              },
            ]
          : []),
        ...(adsenseClientId
          ? [
              {
                src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`,
                async: true,
                crossOrigin: "anonymous" as const,
              },
            ]
          : []),
      ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { googleAnalyticsId } = Route.useLoaderData();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = pathname.startsWith("/admin") || pathname.startsWith("/auth");

  useEffect(() => {
    if (isAdmin) return;
    track("PageView");
    if (!googleAnalyticsId) return;
    const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
    gtag?.("event", "page_view", {
      page_path: pathname,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [googleAnalyticsId, isAdmin, pathname]);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      {!isAdmin && <BottomNav />}
      {!isAdmin && <VisitorNotice />}
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}
