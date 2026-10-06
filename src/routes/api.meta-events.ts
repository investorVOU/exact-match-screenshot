import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { BUSINESS } from "@/config/business";
import { makeCustomData, sendMetaEvent } from "@/lib/meta-capi.server";

const eventSchema = z.object({
  eventName: z.enum(["PageView", "ViewContent", "Lead", "Schedule", "Contact"]),
  eventId: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z0-9_-]+$/),
  eventSourceUrl: z.string().url().max(2048),
  customData: z.record(z.string(), z.unknown()).optional(),
});

function isSameSiteEvent(request: Request, sourceUrl: URL): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    const originUrl = new URL(origin);
    const requestHost =
      request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ?? request.headers.get("host");
    const configuredHost = new URL(BUSINESS.siteUrl).host;
    return (
      originUrl.origin === sourceUrl.origin &&
      (sourceUrl.host === requestHost || sourceUrl.host === configuredHost)
    );
  } catch {
    return false;
  }
}

function cookieValue(request: Request, name: string): string | undefined {
  const pair = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  const value = pair?.slice(name.length + 1);
  return value && value.length <= 512 ? value : undefined;
}

export const Route = createFileRoute("/api/meta-events")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let parsed: z.infer<typeof eventSchema>;
        try {
          parsed = eventSchema.parse(await request.json());
        } catch {
          return new Response(null, { status: 400 });
        }

        const sourceUrl = new URL(parsed.eventSourceUrl);
        if (!isSameSiteEvent(request, sourceUrl)) return new Response(null, { status: 403 });

        const ip =
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          request.headers.get("x-real-ip") ??
          undefined;
        const userAgent = request.headers.get("user-agent")?.slice(0, 500);
        const fbp = cookieValue(request, "_fbp");
        const fbc = cookieValue(request, "_fbc");
        const userData = {
          ...(ip ? { client_ip_address: ip } : {}),
          ...(userAgent ? { client_user_agent: userAgent } : {}),
          ...(fbp ? { fbp } : {}),
          ...(fbc ? { fbc } : {}),
        };

        await sendMetaEvent({
          eventName: parsed.eventName,
          eventId: parsed.eventId,
          eventSourceUrl: sourceUrl.href,
          userData,
          customData: makeCustomData(parsed.customData),
        });
        return new Response(null, { status: 204 });
      },
    },
  },
});
