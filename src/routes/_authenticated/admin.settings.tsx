import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { pixelIdValid } from "@/lib/pixel";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const queryClient = useQueryClient();
  const [pixelId, setPixelId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void supabase
      .from("site_settings")
      .select("pixel_id")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) toast.error(error.message);
        else setPixelId(data?.pixel_id ?? "");
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
    </div>
  );
}
