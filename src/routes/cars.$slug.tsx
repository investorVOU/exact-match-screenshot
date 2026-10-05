import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CalendarCheck, ChevronLeft, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import { getCar } from "@/lib/cars.functions";
import { CarCard, ConditionBadge, SiteFooter, SiteHeader, absUrl, carName } from "@/components/site";
import { Gallery } from "@/components/gallery";
import { formatNaira, telLink, waLink } from "@/config/business";
import { track, trackContact } from "@/lib/pixel";
import { supabase } from "@/integrations/supabase/client";

const carQuery = (slug: string) =>
  queryOptions({ queryKey: ["car", slug], queryFn: () => getCar({ data: { slug } }), staleTime: 60_000 });

export const Route = createFileRoute("/cars/$slug")({
  loader: async ({ context, params }) => {
    const res = await context.queryClient.ensureQueryData(carQuery(params.slug));
    if (!res.car) throw notFound();
    return { data: res, title: carName(res.car), price: res.car.price, image: res.car.images[0], description: res.car.description, condition: res.car.condition };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Car not found — Rush Autos" }, { name: "robots", content: "noindex" }] };
    const title = `${loaderData.title} — ${formatNaira(loaderData.price)} | Rush Autos`;
    const desc = `${loaderData.condition} ${loaderData.title} for ${formatNaira(loaderData.price)} in Abuja. ${loaderData.description ?? ""}`.slice(0, 160);
    const img = loaderData.image ? absUrl(loaderData.image) : undefined;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(img ? [{ property: "og:image", content: img }, { name: "twitter:image", content: img }] : []),
      ],
    };
  },
  component: CarPage,
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center p-6 text-center">
      <div>
        <h1 className="text-2xl font-extrabold">This car isn't available</h1>
        <p className="mt-2 text-muted-foreground">It may have been sold. See our other cars.</p>
        <Link to="/" className="mt-4 inline-flex h-11 items-center rounded-full bg-primary px-5 font-semibold text-primary-foreground">See all cars</Link>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => <div role="alert" className="p-6">Couldn't load this car: {(error as Error).message}</div>,
});

function CarPage() {
  const { data } = Route.useLoaderData();
  const car = data.car!;
  const name = carName(car);
  const price = formatNaira(car.price);
  const sold = car.status === "Sold";
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", date: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    track("ViewContent", { content_name: name, content_type: "vehicle", content_ids: [car.id], value: car.price, currency: "NGN" });
  }, [car.id, car.price, name]);

  const book = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.date) return;
    setBusy(true);
    const msg = `Hello, this is ${form.name.trim()}. I'd like to inspect the ${name} on ${new Date(form.date).toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}.`;
    const win = window.open(waLink(msg), "_blank");
    const { error } = await supabase.from("inspection_requests").insert({ car_id: car.id, name: form.name.trim().slice(0, 100), preferred_date: form.date });
    setBusy(false);
    if (error) toast.error("Couldn't save your request, but you can still WhatsApp us.");
    else { toast.success("Inspection request sent!"); setOpen(false); }
    track("Schedule", { content_name: name });
    if (!win) window.location.href = waLink(msg);
  };

  const specs: [string, string | null][] = [
    ["Mileage", `${car.mileage.toLocaleString()} km`],
    ["Gearbox", car.transmission],
    ["Fuel", car.fuel],
    ["Body type", car.body_type],
    ["Location", car.location],
    ["Condition", car.condition],
    ["Color", car.color],
    ["Engine", car.engine_size],
  ];
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-screen pb-nav">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pt-3">
        <Link to="/" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground"><ChevronLeft className="h-4 w-4" />All cars</Link>
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <Gallery images={car.images} alt={name} />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <ConditionBadge condition={car.condition} />
              {sold && <span className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold uppercase text-destructive-foreground">Sold</span>}
            </div>
            <h1 className="mt-2 text-2xl font-extrabold leading-tight sm:text-3xl">{name}</h1>
            <p className="font-price mt-1 text-3xl font-extrabold text-primary">{price}</p>

            {!sold && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <a href={telLink()} onClick={() => trackContact("call", name)} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground active:scale-95">
                  <Phone className="h-4 w-4" />Call now
                </a>
                <a href={waLink(`Hello, I'm interested in the ${name} (${price}). Is it available?`)} target="_blank" rel="noopener" onClick={() => trackContact("whatsapp", name)}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-whatsapp font-semibold text-whatsapp-foreground active:scale-95">
                  <MessageCircle className="h-4 w-4" />WhatsApp
                </a>
                <button onClick={() => setOpen((v) => !v)} aria-expanded={open}
                  className="col-span-2 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-highlight font-bold text-highlight-foreground active:scale-95">
                  <CalendarCheck className="h-4 w-4" />Book inspection
                </button>
              </div>
            )}

            {open && (
              <form onSubmit={book} className="mt-3 space-y-3 rounded-2xl bg-card p-4 shadow-card">
                <label className="block text-sm font-semibold">Your name
                  <input required maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3 font-normal" />
                </label>
                <label className="block text-sm font-semibold">Preferred date
                  <input required type="date" min={today} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3 font-normal" />
                </label>
                <button disabled={busy} className="h-12 w-full rounded-xl bg-primary font-semibold text-primary-foreground disabled:opacity-60">
                  {busy ? "Sending…" : "Send & open WhatsApp"}
                </button>
              </form>
            )}

            <dl className="mt-5 grid grid-cols-2 gap-2">
              {specs.filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="rounded-xl bg-card p-3 shadow-card">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{k}</dt>
                  <dd className="text-sm font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
            {car.description && (
              <div className="mt-5">
                <h2 className="text-lg font-bold">Description</h2>
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{car.description}</p>
              </div>
            )}
          </div>
        </div>

        {data.similar.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-extrabold">Similar cars</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {data.similar.map((c) => <CarCard key={c.id} car={c} />)}
            </div>
          </section>
        )}
      </main>
      <div className="mt-10"><SiteFooter /></div>
    </div>
  );
}
