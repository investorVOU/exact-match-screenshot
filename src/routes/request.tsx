import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { SiteFooter, SiteHeader } from "@/components/site";
import { supabase } from "@/integrations/supabase/client";
import { waLink } from "@/config/business";
import { track } from "@/lib/pixel";

export const Route = createFileRoute("/request")({
  head: () => ({
    meta: [
      { title: "Request a Car — Rush Autos Abuja" },
      { name: "description", content: "Tell Rush Autos the car you want and your budget. We'll source a Tokunbo or Nigerian used car for you in Abuja." },
      { property: "og:title", content: "Request a Car — Rush Autos" },
      { property: "og:description", content: "Can't find it? Tell us the car and budget and we'll source it for you." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RequestPage,
});

function RequestPage() {
  const [f, setF] = useState({ name: "", phone: "", car: "", budget: "", type: "Foreign Used" });
  const [busy, setBusy] = useState(false);
  const input = "mt-1 h-12 w-full rounded-xl border border-input bg-background px-3 font-normal";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const msg = `Hello Rush Autos, this is ${f.name}. I'm looking for a ${f.type} ${f.car}. My budget is ${f.budget || "flexible"}. My number is ${f.phone}.`;
    const win = window.open(waLink(msg), "_blank");
    const { error } = await supabase.from("car_requests").insert({
      name: f.name.trim().slice(0, 100), phone: f.phone.trim().slice(0, 30), car_wanted: f.car.trim().slice(0, 200), budget: f.budget.trim().slice(0, 50), type: f.type,
    });
    setBusy(false);
    if (error) toast.error("Couldn't save your request, but you can still WhatsApp us.");
    else { toast.success("Request sent! We'll get back to you."); setF({ name: "", phone: "", car: "", budget: "", type: "Foreign Used" }); }
    track("Lead", { content_name: f.car });
    if (!win) window.location.href = waLink(msg);
  };

  return (
    <div className="min-h-screen pb-nav">
      <SiteHeader />
      <main className="mx-auto max-w-lg px-4 py-6">
        <h1 className="text-3xl font-extrabold">Request a car</h1>
        <p className="mt-1 text-muted-foreground">Tell us what you want. We'll find it and send you photos.</p>
        <form onSubmit={submit} className="mt-5 space-y-3 rounded-2xl bg-card p-4 shadow-card">
          <label className="block text-sm font-semibold">Your name<input required maxLength={100} className={input} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
          <label className="block text-sm font-semibold">Phone number<input required type="tel" minLength={5} maxLength={30} className={input} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="080..." /></label>
          <label className="block text-sm font-semibold">Car you want<input required maxLength={200} className={input} value={f.car} onChange={(e) => setF({ ...f, car: e.target.value })} placeholder="e.g. 2015 Toyota Camry" /></label>
          <label className="block text-sm font-semibold">Budget<input maxLength={50} className={input} value={f.budget} onChange={(e) => setF({ ...f, budget: e.target.value })} placeholder="e.g. ₦10,000,000" /></label>
          <fieldset>
            <legend className="text-sm font-semibold">Type</legend>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {["Foreign Used", "Nigerian Used"].map((t) => (
                <button type="button" key={t} onClick={() => setF({ ...f, type: t })}
                  className={`h-12 rounded-xl text-sm font-semibold ${f.type === t ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{t}</button>
              ))}
            </div>
          </fieldset>
          <button disabled={busy} className="h-12 w-full rounded-xl bg-highlight font-bold text-highlight-foreground disabled:opacity-60">
            {busy ? "Sending…" : "Send request & open WhatsApp"}
          </button>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}
