import { createSign } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GA_DATA_API = "https://analyticsdata.googleapis.com/v1beta";
const READONLY_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";

type ServiceAccount = { client_email?: string; private_key?: string };
type Metric = { value?: string };
type ReportRow = { dimensionValues?: { value?: string }[]; metricValues?: Metric[] };
type ReportResponse = { rows?: ReportRow[]; totals?: ReportRow[] };

function encodeBase64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function createAssertion(clientEmail: string, privateKey: string) {
  const now = Math.floor(Date.now() / 1000);
  const unsigned = [
    encodeBase64Url(JSON.stringify({ alg: "RS256", typ: "JWT" })),
    encodeBase64Url(
      JSON.stringify({
        iss: clientEmail,
        scope: READONLY_SCOPE,
        aud: GOOGLE_TOKEN_URL,
        iat: now,
        exp: now + 3600,
      }),
    ),
  ].join(".");
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  return `${unsigned}.${signer.sign(privateKey, "base64url")}`;
}

async function getAccessToken(account: ServiceAccount) {
  if (!account.client_email || !account.private_key) {
    throw new Error("The Google service account JSON is missing client_email or private_key.");
  }
  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: createAssertion(account.client_email, account.private_key),
  });
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) throw new Error("Google could not authorize the Analytics service account.");
  const result = (await response.json()) as { access_token?: string };
  if (!result.access_token) throw new Error("Google did not return an Analytics access token.");
  return result.access_token;
}

async function runReport<T>(token: string, propertyId: string, request: Record<string, unknown>) {
  const response = await fetch(
    `${GA_DATA_API}/properties/${encodeURIComponent(propertyId)}:runReport`,
    {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(request),
    },
  );
  if (!response.ok) {
    console.error(`[Google Analytics] Report request failed with status ${response.status}`);
    throw new Error(
      "Google Analytics could not return a report. Check the property ID and service account access.",
    );
  }
  return (await response.json()) as T;
}

function metricValues(report: ReportResponse) {
  return report.totals?.[0]?.metricValues ?? report.rows?.[0]?.metricValues ?? [];
}

const numberAt = (values: Metric[], index: number) => Number(values[index]?.value ?? 0);

export const getGoogleAnalyticsReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error || !isAdmin) throw new Error("Only admins can view Google Analytics reports.");

    const propertyId = process.env["GA4_PROPERTY_ID"]?.trim();
    const serviceAccountJson = process.env["GOOGLE_ANALYTICS_SERVICE_ACCOUNT_JSON"];
    const missing = [
      ...(!propertyId ? ["GA4_PROPERTY_ID"] : []),
      ...(!serviceAccountJson ? ["GOOGLE_ANALYTICS_SERVICE_ACCOUNT_JSON"] : []),
    ];
    if (missing.length) return { configured: false as const, missing };

    let serviceAccount: ServiceAccount;
    try {
      serviceAccount = JSON.parse(serviceAccountJson!) as ServiceAccount;
    } catch {
      throw new Error(
        "GOOGLE_ANALYTICS_SERVICE_ACCOUNT_JSON must contain valid service-account JSON.",
      );
    }

    const token = await getAccessToken(serviceAccount);
    const [summary, daily, pages] = await Promise.all([
      runReport<ReportResponse>(token, propertyId!, {
        dateRanges: [{ startDate: "27daysAgo", endDate: "today" }],
        metrics: [
          { name: "totalUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
          { name: "bounceRate" },
        ],
      }),
      runReport<ReportResponse>(token, propertyId!, {
        dateRanges: [{ startDate: "27daysAgo", endDate: "today" }],
        dimensions: [{ name: "date" }],
        metrics: [{ name: "screenPageViews" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      }),
      runReport<ReportResponse>(token, propertyId!, {
        dateRanges: [{ startDate: "27daysAgo", endDate: "today" }],
        dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
        metrics: [{ name: "screenPageViews" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: "8",
      }),
    ]);

    const totals = metricValues(summary);
    return {
      configured: true as const,
      users: numberAt(totals, 0),
      sessions: numberAt(totals, 1),
      pageViews: numberAt(totals, 2),
      bounceRate: numberAt(totals, 3),
      daily: (daily.rows ?? []).map((row) => ({
        date: row.dimensionValues?.[0]?.value ?? "",
        views: numberAt(row.metricValues ?? [], 0),
      })),
      pages: (pages.rows ?? []).map((row) => ({
        path: row.dimensionValues?.[0]?.value ?? "",
        title: row.dimensionValues?.[1]?.value ?? "",
        views: numberAt(row.metricValues ?? [], 0),
      })),
    };
  });
