import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, MessageCircle, Search } from "lucide-react";
import { listBrands, listCars, listFiltersSchema, type ListFilters } from "@/lib/cars.functions";
import { CarCard, SiteFooter, SiteHeader, TrustSection } from "@/components/site";
import { BUSINESS, waLink } from "@/config/business";
import { trackContact } from "@/lib/pixel";

const carsQuery = (f: ListFilters) =>
  queryOptions({ queryKey: ["cars", f], queryFn: () => listCars({ data: f }), staleTime: 60_000 });
const brandsQuery = queryOptions({ queryKey: ["brands"], queryFn: () => listBrands(), staleTime: 300_000 });

const searchSchema = listFiltersSchema.extend({
  max: listFiltersSchema.shape.max.catch(0),
  page: listFiltersSchema.shape.page.catch(1),
}).partial();

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>) => {
    const r = searchSchema.safeParse({ ...s, max: s["max"] ? Number(s["max"]) : undefined, page: s["page"] ? Number(s["page"]) : undefined });
    return r.success ? r.data : {};
  },
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    const [cars, brands] = await Promise.all([
      context.queryClient.ensureQueryData(carsQuery(listFiltersSchema.parse(deps))),
      context.queryClient.ensureQueryData(brandsQuery),
    ]);
    return { cars, brands };
  },
  head: () => ({
    meta: [
      { title: "Rush Autos — Used Cars for Sale in Abuja | Tokunbo & Nigerian Used" },
      { name: "description", content: "Browse foreign used (Tokunbo) and Nigerian used cars in Abuja. Real photos, real prices. Call or WhatsApp Rush Autos and inspect before you pay." },
      { property: "og:title", content: "Rush Autos — Find your next car in Abuja" },
      { property: "og:description", content: "Tokunbo and Nigerian used cars. Inspect before you pay. Call or WhatsApp us." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
  errorComponent: ({ error }) => <div role="alert" className="p-6">Couldn't load cars: {(error as Error).message}</div>,
  notFoundComponent: () => <div className="p-6">Nothing here.</div>,
});

const BODY_TYPES = ["Sedan", "SUV", "Pickup", "Bus", "Coupe", "Hatchback"];
const MAX_PRICES = [5_000_000, 10_000_000, 20_000_000, 50_000_000];
const TABS: { id: ListFilters["tab"]; label: string }[] = [
  { id: "all", label: "All cars" },
  { id: "foreign", label: "Foreign Used" },
  { id: "nigerian", label: "Nigerian Used" },
];

function Index() {
  const search = Route.useSearch();
  const filters = listFiltersSchema.parse(search);
  const navigate = useNavigate({ from: "/" });
  const loaded = Route.useLoaderData();
  const { data, isFetching } = useQuery({ ...carsQuery(filters), initialData: loaded.cars, placeholderData: keepPreviousData });
  const { data: brands = [] } = useQuery({ ...brandsQuery, initialData: loaded.brands });
  const [q, setQ] = useState(filters.q);
  const listRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  const setFilter = (patch: Partial<ListFilters>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch, page: undefined }), replace: true, resetScroll: false });

  useEffect(() => {
    if (q === filters.q) return;
    const t = setTimeout(() => setFilter({ q: q || undefined } as Partial<ListFilters>), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [filters.page]);

  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / BUSINESS.carsPerPage));
  const goPage = (p: number) => navigate({ search: (prev) => ({ ...prev, page: p === 1 ? undefined : p }), resetScroll: false });

  const select = "h-11 w-full min-w-0 rounded-xl border border-input bg-card px-3 text-sm font-medium";

  return (
    <div className="min-h-screen pb-nav">
      <SiteHeader />
      <section className="bg-brand text-brand-foreground">
        <div className="mx-auto max-w-6xl px-4 pb-8 pt-6 sm:pb-12 sm:pt-10">
          <h1 className="max-w-2xl text-3xl font-extrabold leading-[1.05] sm:text-5xl">
            Find your next car. <span className="text-highlight">Inspect before you pay.</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm opacity-85 sm:text-base">
            Quality Foreign Used (Tokunbo) and Nigerian Used cars in Abuja, with real photos and honest prices.
          </p>
        </div>
      </section>

      <div ref={listRef} id="listings" className="mx-auto max-w-6xl scroll-mt-16 px-4 pt-4">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter({ tab: t.id === "all" ? undefined : t.id } as Partial<ListFilters>)}
              className={`h-10 shrink-0 rounded-full px-4 text-sm font-semibold transition ${filters.tab === t.id ? "bg-primary text-primary-foreground" : "bg-card text-foreground shadow-card"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
          <label className="relative col-span-2 sm:col-span-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search make or model" aria-label="Search make or model" className={`${select} pl-9`} />
          </label>
          <select aria-label="Brand" className={select} value={filters.brand} onChange={(e) => setFilter({ brand: e.target.value || undefined } as Partial<ListFilters>)}>
            <option value="">All brands</option>
            {brands.map((b) => <option key={b}>{b}</option>)}
          </select>
          <select aria-label="Body type" className={select} value={filters.body} onChange={(e) => setFilter({ body: e.target.value || undefined } as Partial<ListFilters>)}>
            <option value="">Any body</option>
            {BODY_TYPES.map((b) => <option key={b}>{b}</option>)}
          </select>
          <select aria-label="Max price" className={select} value={filters.max} onChange={(e) => setFilter({ max: Number(e.target.value) || undefined } as Partial<ListFilters>)}>
            <option value={0}>Any price</option>
            {MAX_PRICES.map((p) => <option key={p} value={p}>Up to ₦{p / 1_000_000}m</option>)}
          </select>
          <select aria-label="Sort" className={select} value={filters.sort} onChange={(e) => setFilter({ sort: e.target.value === "newest" ? undefined : (e.target.value as ListFilters["sort"]) } as Partial<ListFilters>)}>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
        </div>

        <p className="mt-4 text-sm font-semibold text-muted-foreground" aria-live="polite">
          {total} car{total === 1 ? "" : "s"} found
        </p>

        {data && data.cars.length === 0 ? (
          <div className="mt-4 rounded-2xl bg-card p-6 text-center shadow-card">
            <p className="font-semibold">No cars match. Clear a filter, or WhatsApp us and we'll source it for you.</p>
            <a href={waLink("Hello Rush Autos, please help me source a car.")} target="_blank" rel="noopener" onClick={() => trackContact("whatsapp")}
              className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-whatsapp px-5 text-sm font-semibold text-whatsapp-foreground">
              <MessageCircle className="h-4 w-4" />WhatsApp us
            </a>
          </div>
        ) : (
          <div className={`mt-3 grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3 lg:grid-cols-[repeat(4,minmax(0,1fr))] ${isFetching ? "opacity-60" : ""} transition-opacity`}>
            {data?.cars.map((c, i) => <CarCard key={c.id} car={c} eager={i < 2} />)}
          </div>
        )}

        {pages > 1 && (
          <nav aria-label="Pages" className="mt-6 flex items-center justify-center gap-1.5">
            <button disabled={filters.page <= 1} onClick={() => goPage(filters.page - 1)} className="inline-flex h-11 items-center gap-1 rounded-full bg-card px-3 text-sm font-semibold shadow-card disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" />Prev
            </button>
            {Array.from({ length: pages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === pages || Math.abs(p - filters.page) <= 1)
              .map((p, i, arr) => (
                <span key={p} className="flex items-center gap-1.5">
                  {i > 0 && p - (arr[i - 1] ?? p) > 1 && <span className="text-muted-foreground">…</span>}
                  <button onClick={() => goPage(p)} aria-current={p === filters.page ? "page" : undefined}
                    className={`h-11 w-11 rounded-full text-sm font-bold ${p === filters.page ? "bg-primary text-primary-foreground" : "bg-card shadow-card"}`}>
                    {p}
                  </button>
                </span>
              ))}
            <button disabled={filters.page >= pages} onClick={() => goPage(filters.page + 1)} className="inline-flex h-11 items-center gap-1 rounded-full bg-card px-3 text-sm font-semibold shadow-card disabled:opacity-40">
              Next<ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        )}
      </div>

      <TrustSection />
      <SiteFooter />
    </div>
  );
}
