import { useEffect, useState } from "react";
import { Star, BadgeCheck } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

type Review = { id: string; name: string; location: string | null; car: string | null; rating: number; comment: string; created_at: string };

export const reviewSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(80),
  location: z.string().trim().max(60),
  car: z.string().trim().max(100),
  rating: z.number().int().min(1, "Pick a star rating").max(5),
  comment: z.string().trim().min(5, "Tell us a bit more").max(800),
});

function Stars({ value, size = "h-4 w-4" }: { value: number; size?: string }) {
  return (
    <span className="inline-flex" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`${size} ${i <= value ? "fill-highlight text-highlight" : "text-muted-foreground/40"}`} />)}
    </span>
  );
}

export function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", location: "", car: "", rating: 0, comment: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const load = () =>
    supabase.from("customer_reviews").select("id,name,location,car,rating,comment,created_at").eq("approved", true)
      .order("created_at", { ascending: false }).limit(12).then(({ data }) => setReviews(data ?? []));
  useEffect(() => { load(); }, []);

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = reviewSchema.safeParse(form);
    if (!p.success) return setErr(p.error.issues[0]?.message ?? "Please check the form");
    setBusy(true); setErr("");
    const { error } = await supabase.from("customer_reviews").insert({ ...p.data, location: p.data.location || null, car: p.data.car || null });
    setBusy(false);
    if (error) return setErr("Could not send your review. Please try again.");
    setDone(true); setForm({ name: "", location: "", car: "", rating: 0, comment: "" }); load();
  }

  const input = "mt-1 h-11 w-full rounded-xl border border-input bg-background px-3 font-normal";
  return (
    <section className="mx-auto max-w-6xl px-4 py-8" aria-labelledby="reviews-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="reviews-title" className="text-2xl font-extrabold">What our buyers say</h2>
          {reviews.length > 0 && (
            <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><Stars value={Math.round(avg)} /> {avg.toFixed(1)} from {reviews.length} reviews</p>
          )}
        </div>
        <button onClick={() => { setOpen((v) => !v); setDone(false); }} className="h-11 rounded-full bg-highlight px-5 text-sm font-bold text-highlight-foreground active:scale-95">
          {open ? "Close" : "Write a review"}
        </button>
      </div>

      {open && (
        <form onSubmit={submit} className="mt-4 space-y-3 rounded-2xl bg-card p-4 shadow-card">
          {done ? <p className="font-semibold text-primary">Thank you! Your review is now on the site.</p> : <>
            <div>
              <p className="text-sm font-semibold">Your rating</p>
              <div className="mt-1 flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button type="button" key={i} aria-label={`${i} star${i > 1 ? "s" : ""}`} onClick={() => setForm({ ...form, rating: i })} className="p-1">
                    <Star className={`h-8 w-8 ${i <= form.rating ? "fill-highlight text-highlight" : "text-muted-foreground/40"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block text-sm font-semibold">Your name<input maxLength={80} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} /></label>
              <label className="block text-sm font-semibold">City<input maxLength={60} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={input} placeholder="Abuja" /></label>
              <label className="block text-sm font-semibold">Car you bought<input maxLength={100} value={form.car} onChange={(e) => setForm({ ...form, car: e.target.value })} className={input} placeholder="2016 Toyota Camry" /></label>
            </div>
            <label className="block text-sm font-semibold">Your experience
              <textarea rows={4} maxLength={800} value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} className={`${input} h-auto py-2`} />
            </label>
            {err && <p className="text-sm font-semibold text-destructive">{err}</p>}
            <button disabled={busy} className="h-12 w-full rounded-xl bg-primary font-semibold text-primary-foreground disabled:opacity-60">{busy ? "Sending…" : "Submit review"}</button>
          </>}
        </form>
      )}

      <div className="mt-4 flex snap-x gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3">
        {reviews.map((r) => (
          <article key={r.id} className="w-[80%] shrink-0 snap-start rounded-2xl bg-card p-4 shadow-card sm:w-auto">
            <Stars value={r.rating} />
            <p className="mt-2 text-sm leading-relaxed wrap-anywhere">“{r.comment}”</p>
            <p className="mt-3 flex items-center gap-1 text-sm font-bold">{r.name}<BadgeCheck className="h-4 w-4 text-primary" /></p>
            <p className="text-xs text-muted-foreground">{[r.car, r.location].filter(Boolean).join(" · ")}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
