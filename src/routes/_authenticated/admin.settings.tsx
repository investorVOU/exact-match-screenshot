import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BarChart3, RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { extractAdsensePublisherId } from "@/lib/adsense";
import { extractGoogleAnalyticsId } from "@/lib/google-analytics";
import { getGoogleAnalyticsReport } from "@/lib/google-analytics.functions";
import { pixelIdValid } from "@/lib/pixel";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const queryClient = useQueryClient();
  const analyticsQuery = useQuery({
    queryKey: ["admin-google-analytics-report"],
    queryFn: () => getGoogleAnalyticsReport(),
    staleTime: 5 * 60_000,
    refetchInterval: 15 * 60_000,
  });
  const [pixelId, setPixelId] = useState("");
  const [adsenseCode, setAdsenseCode] = useState("");
  const [googleAnalyticsCode, setGoogleAnalyticsCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingAdsense, setSavingAdsense] = useState(false);
  const [savingGoogleAnalytics, setSavingGoogleAnalytics] = useState(false);

  useEffect(() => {
    let active = true;
    void supabase
      .from("site_settings")
      .select("pixel_id, adsense_client_id, google_analytics_id")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) toast.error(error.message);
        else {
          setPixelId(data?.pixel_id ?? "");
          setAdsenseCode(data?.adsense_client_id ?? "");
          setGoogleAnalyticsCode(data?.google_analytics_id ?? "");
        }
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = pixelId.trim();
    if (value && !pixelIdValid(value)) {
      toast.error("Enter the numeric Meta Pixel ID, not the full script.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("site_settings").upsert(
      {
        id: 1,
        pixel_id: value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      await queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success(value ? "Meta Pixel saved" : "Meta Pixel disabled");
    }
  };

  const saveAdsense = async (e: React.FormEvent) => {
    e.preventDefault();
    const publisherId = extractAdsensePublisherId(adsenseCode);
    if (publisherId === null) {
      toast.error("Paste a valid AdSense publisher ID or Google AdSense code snippet.");
      return;
    }
    setSavingAdsense(true);
    const { error } = await supabase.from("site_settings").upsert(
      {
        id: 1,
        adsense_client_id: publisherId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
    setSavingAdsense(false);
    if (error) toast.error(error.message);
    else {
      setAdsenseCode(publisherId);
      await queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success(publisherId ? "AdSense saved" : "AdSense disabled");
    }
  };

  const saveGoogleAnalytics = async (e: React.FormEvent) => {
    e.preventDefault();
    const measurementId = extractGoogleAnalyticsId(googleAnalyticsCode);
    if (measurementId === null) {
      toast.error("Enter a valid GA4 Measurement ID or Google tag snippet.");
      return;
    }
    setSavingGoogleAnalytics(true);
    const { error } = await supabase.from("site_settings").upsert(
      {
        id: 1,
        google_analytics_id: measurementId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
    setSavingGoogleAnalytics(false);
    if (error) toast.error(error.message);
    else {
      setGoogleAnalyticsCode(measurementId);
      await queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success(measurementId ? "Google Analytics saved" : "Google Analytics disabled");
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-extrabold">Settings</h1>
      <section className="mt-4 rounded-2xl bg-card p-4 shadow-card sm:p-6">
        <h2 className="text-lg font-bold">Meta tracking</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure the browser Pixel and server-side Conversions API.
        </p>
        <form onSubmit={save} className="mt-5 space-y-4">
          <label className="block text-sm font-semibold">
            Meta Pixel ID
            <input
              inputMode="numeric"
              autoComplete="off"
              value={pixelId}
              onChange={(e) => setPixelId(e.target.value)}
              placeholder="123456789012345"
              disabled={loading || saving}
              className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3 font-mono text-sm font-normal"
            />
          </label>
          <p className="text-xs text-muted-foreground">
            Enter only the numeric ID from Meta Events Manager. Leave blank to disable Pixel
            tracking.
          </p>
          <div className="rounded-xl bg-muted p-3 text-sm">
            <p className="font-semibold">Conversions API access token</p>
            <p className="mt-1 text-muted-foreground">
              Set <code>META_CONVERSIONS_API_ACCESS_TOKEN</code> in Render. It is kept server-side
              and must not be pasted here.
            </p>
          </div>
          <button
            disabled={loading || saving}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save Pixel ID"}
          </button>
        </form>
      </section>
      <section className="mt-4 rounded-2xl bg-card p-4 shadow-card sm:p-6">
        <h2 className="text-lg font-bold">Google AdSense</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste your publisher ID or the AdSense code snippet provided by Google.
        </p>
        <form onSubmit={saveAdsense} className="mt-5 space-y-4">
          <label className="block text-sm font-semibold">
            Publisher ID or code
            <textarea
              value={adsenseCode}
              onChange={(e) => setAdsenseCode(e.target.value)}
              placeholder="ca-pub-1234567890123456"
              disabled={loading || savingAdsense}
              rows={4}
              className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 font-mono text-sm font-normal"
            />
          </label>
          <p className="text-xs text-muted-foreground">
            Only the publisher ID is stored. Leave blank to remove AdSense from the site.
          </p>
          <button
            disabled={loading || savingAdsense}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {savingAdsense ? "Saving…" : "Save AdSense"}
          </button>
        </form>
      </section>
      <section className="mt-4 rounded-2xl bg-card p-4 shadow-card sm:p-6">
        <h2 className="text-lg font-bold">Google Analytics</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste your GA4 Measurement ID or the Google tag snippet from Analytics.
        </p>
        <form onSubmit={saveGoogleAnalytics} className="mt-5 space-y-4">
          <label className="block text-sm font-semibold">
            Measurement ID or code
            <textarea
              value={googleAnalyticsCode}
              onChange={(e) => setGoogleAnalyticsCode(e.target.value)}
              placeholder="G-ABC123XYZ9"
              disabled={loading || savingGoogleAnalytics}
              rows={4}
              className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 font-mono text-sm font-normal"
            />
          </label>
          <p className="text-xs text-muted-foreground">
            Only the measurement ID is stored. Leave blank to disable Google Analytics.
          </p>
          <button
            disabled={loading || savingGoogleAnalytics}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {savingGoogleAnalytics ? "Saving…" : "Save Google Analytics"}
          </button>
        </form>
        <div className="mt-6 border-t border-border pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 text-base font-bold">
                <BarChart3 className="h-4 w-4" />
                Last 28 days
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Visitors, sessions, page views, and top pages from GA4.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void analyticsQuery.refetch()}
              disabled={analyticsQuery.isFetching}
              aria-label="Refresh Google Analytics report"
              title="Refresh report"
              className="grid h-10 w-10 place-items-center rounded-lg border border-input disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${analyticsQuery.isFetching ? "animate-spin" : ""}`} />
            </button>
          </div>

          {analyticsQuery.isPending ? (
            <p className="mt-5 text-sm text-muted-foreground">Loading Google Analytics…</p>
          ) : analyticsQuery.isError ? (
            <p
              role="alert"
              className="mt-5 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
            >
              {analyticsQuery.error.message}
            </p>
          ) : !analyticsQuery.data.configured ? (
            <div className="mt-4 rounded-lg bg-muted p-3 text-sm">
              <p className="font-semibold">Reporting is not connected yet.</p>
              <p className="mt-1 text-muted-foreground">
                Add these server-side Render environment variables to enable GA4 reports:
              </p>
              <ul className="mt-2 list-inside list-disc font-mono text-xs">
                {analyticsQuery.data.missing.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">
                Share the GA4 property with the service account as Viewer. Keep the service-account
                JSON private.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ["Users", analyticsQuery.data.users],
                  ["Sessions", analyticsQuery.data.sessions],
                  ["Page views", analyticsQuery.data.pageViews],
                  ["Bounce rate", `${(analyticsQuery.data.bounceRate * 100).toFixed(1)}%`],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-muted p-3">
                    <p className="text-xs font-medium text-muted-foreground">{label}</p>
                    <p className="mt-1 text-xl font-bold">
                      {typeof value === "number" ? value.toLocaleString() : value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5">
                <h4 className="text-sm font-semibold">Daily page views</h4>
                {analyticsQuery.data.daily.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    No page-view data for this period.
                  </p>
                ) : (
                  <div
                    className="mt-3 flex h-28 items-end gap-1"
                    role="img"
                    aria-label="Daily page views over the last 28 days"
                  >
                    {analyticsQuery.data.daily.map((day) => {
                      const max = Math.max(
                        ...analyticsQuery.data.daily.map((item) => item.views),
                        1,
                      );
                      const height = Math.max(4, (day.views / max) * 100);
                      return (
                        <div
                          key={day.date}
                          title={`${day.date}: ${day.views.toLocaleString()} views`}
                          className="min-w-0 flex-1 rounded-t-sm bg-primary/80"
                          style={{ height: `${height}%` }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mt-5">
                <h4 className="text-sm font-semibold">Top pages</h4>
                {analyticsQuery.data.pages.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    No page data for this period.
                  </p>
                ) : (
                  <ul className="mt-2 divide-y divide-border">
                    {analyticsQuery.data.pages.map((page) => (
                      <li
                        key={page.path}
                        className="flex items-center justify-between gap-3 py-2 text-sm"
                      >
                        <span className="min-w-0 truncate" title={page.title}>
                          {page.path}
                        </span>
                        <span className="shrink-0 font-semibold">
                          {page.views.toLocaleString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
