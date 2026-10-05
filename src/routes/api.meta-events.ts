import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { BUSINESS } from "@/config/business";
import { publicDb } from "@/lib/cars.server";

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

function makeCustomData(input: Record<string, unknown> | undefined) {
  if (!input) return undefined;
  const result: Record<string, string | string[] | number> = {};
  for (const key of ["content_name", "content_type", "currency", "method"] as const) {
    const value = input[key];
    if (typeof value === "string") result[key] = value.slice(0, 200);
  }
  if (Array.isArray(input.content_ids)) {
    result.content_ids = input.content_ids
      .filter((value): value is string => typeof value === "string")
      .slice(0, 10)
      .map((value) => value.slice(0, 200));
  }
  if (typeof input.value === "number" && Number.isFinite(input.value) && input.value >= 0) {
    result.value = input.value;
  }
  return Object.keys(result).length ? result : undefined;
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

        const accessToken = process.env["META_CONVERSIONS_API_ACCESS_TOKEN"];
        if (!accessToken) return new Response(null, { status: 204 });

        let pixelId = BUSINESS.pixelId;
        try {
          const { data } = await publicDb()
            .from("site_settings")
            .select("pixel_id")
            .eq("id", 1)
            .maybeSingle();
          if (data?.pixel_id) pixelId = data.pixel_id;
        } catch {
          // Keep CAPI optional until its settings table is deployed.
        }
        if (!/^\d{6,}$/.test(pixelId)) return new Response(null, { status: 204 });

        const ip =
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          request.headers.get("x-real-ip") ??
          undefined;
        const userAgent = request.headers.get("user-agent")?.slice(0, 500);
        const userData = {
          ...(ip ? { client_ip_address: ip } : {}),
          ...(userAgent ? { client_user_agent: userAgent } : {}),
          ...(cookieValue(request, "_fbp") ? { fbp: cookieValue(request, "_fbp") } : {}),
          ...(cookieValue(request, "_fbc") ? { fbc: cookieValue(request, "_fbc") } : {}),
        };
        const version = process.env["META_GRAPH_API_VERSION"] ?? "v23.0";
        const endpoint = new URL(`https://graph.facebook.com/${version}/${pixelId}/events`);
        endpoint.searchParams.set("access_token", accessToken);
        const testEventCode = process.env["META_TEST_EVENT_CODE"];
        const payload = {
          data: [
            {
              event_name: parsed.eventName,
              event_time: Math.floor(Date.now() / 1000),
              event_id: parsed.eventId,
              action_source: "website",
              event_source_url: sourceUrl.href,
              user_data: userData,
              ...(makeCustomData(parsed.customData)
                ? { custom_data: makeCustomData(parsed.customData) }
                : {}),
            },
          ],
          ...(testEventCode ? { test_event_code: testEventCode } : {}),
        };

        try {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!response.ok)
            console.error(`[Meta CAPI] Event rejected with status ${response.status}`);
        } catch {
          console.error("[Meta CAPI] Event delivery failed");
        }
        return new Response(null, { status: 204 });
      },
    },
  },
});
