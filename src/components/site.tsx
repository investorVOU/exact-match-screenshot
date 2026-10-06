import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Car, Home, MessageCircle, Phone, ShieldCheck, BadgeCheck, FileCheck2, MapPin } from "lucide-react";
import { BUSINESS, displayPhone, formatNaira, telLink, waLink } from "@/config/business";
import { trackContact } from "@/lib/pixel";
import type { CarCardDTO } from "@/lib/cars.functions";

export const carName = (c: { year: number; make: string; model: string }) => `${c.year} ${c.make} ${c.model}`;
export const absUrl = (u: string) => (u.startsWith("http") ? u : BUSINESS.siteUrl + u);

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2 font-display text-xl font-extrabold tracking-tight ${className}`}>
      <img
        src="/ChatGPT%20Image%20Oct%206,%202026,%2007_16_44%20AM.png"
        alt=""
        aria-hidden="true"
        className="h-10 w-14 shrink-0 rounded-sm object-cover"
      />
      <span><span className="text-brand-foreground">Rush</span> <span className="text-highlight">Autos</span></span>
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 bg-brand text-brand-foreground">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Logo />
        <a
          href={telLink()}
          onClick={() => trackContact("call")}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-highlight px-4 text-sm font-semibold text-highlight-foreground active:scale-95"
        >
          <Phone className="h-4 w-4" /> Call us
        </a>
      </div>
    </header>
  );
}

export function BottomNav() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const goList = async () => {
    if (pathname !== "/") await navigate({ to: "/" });
    setTimeout(() => document.getElementById("listings")?.scrollIntoView({ behavior: "smooth" }), 50);
  };
  const goHome = async () => {
    if (pathname !== "/") await navigate({ to: "/" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const item = "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-full py-2 text-[11px] font-semibold text-foreground/80 active:scale-95 transition";
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 px-4"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
    >
      <div className="glass-nav mx-auto flex max-w-md items-center gap-1 rounded-full p-1.5">
        <button className={item} onClick={goHome}><Home className="h-5 w-5" />Home</button>
        <button className={item} onClick={goList}><Car className="h-5 w-5" />Cars</button>
        <a className={item} href={telLink()} onClick={() => trackContact("call")}><Phone className="h-5 w-5" />Call</a>
        <a className={`${item} bg-whatsapp text-whatsapp-foreground`} href={waLink()} target="_blank" rel="noopener" onClick={() => trackContact("whatsapp")}>
          <MessageCircle className="h-5 w-5" />Chat
        </a>
      </div>
    </nav>
  );
}

export function ConditionBadge({ condition }: { condition: string }) {
  const foreign = condition === "Foreign Used";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${foreign ? "bg-highlight text-highlight-foreground" : "bg-brand text-brand-foreground"}`}>
      {foreign ? "Foreign Used" : "Nigerian Used"}
    </span>
  );
}

export function CarCard({ car, eager = false }: { car: CarCardDTO; eager?: boolean }) {
  const name = carName(car);
  const sold = car.status === "Sold";
  const msg = `Hello, I'm interested in the ${name} (${formatNaira(car.price)}). Is it available?`;
  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl bg-card shadow-card">
      <Link to="/cars/$slug" params={{ slug: car.slug }} className="relative block aspect-[4/3] bg-muted">
        {car.images[0] && (
          <img
            src={car.images[0]}
            alt={name}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            width={400}
            height={300}
            sizes="(min-width: 1024px) 25vw, 50vw"
            className={`h-full w-full object-cover ${sold ? "opacity-60 grayscale" : ""}`}
          />
        )}
        <div className="absolute left-2 top-2"><ConditionBadge condition={car.condition} /></div>
        <span className="absolute bottom-2 right-2 rounded-full bg-overlay px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
          {car.images.length} photo{car.images.length === 1 ? "" : "s"}
        </span>
        {sold && (
          <span className="absolute inset-0 grid place-items-center">
            <span className="rotate-[-8deg] rounded-md bg-destructive px-3 py-1 font-display text-lg font-extrabold uppercase text-destructive-foreground">Sold</span>
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-2.5 sm:p-3">
        <p className="font-price text-base font-extrabold text-primary sm:text-lg">{formatNaira(car.price)}</p>
        <Link to="/cars/$slug" params={{ slug: car.slug }} className="line-clamp-2 min-w-0 text-sm font-semibold leading-tight wrap-anywhere">
          {name}
        </Link>
        <p className="text-[11px] text-muted-foreground">{car.mileage.toLocaleString()} km · {car.transmission}</p>
        <p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground"><MapPin className="h-3 w-3 shrink-0" />{car.location}</p>
        {!sold && (
          <div className="mt-auto grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-1.5 pt-2">
            <a href={telLink()} onClick={() => trackContact("call", name)} className="inline-flex h-10 min-w-0 items-center justify-center gap-1 rounded-xl bg-secondary px-1 text-xs font-semibold active:scale-95">
              <Phone className="h-3.5 w-3.5 shrink-0" />Call
            </a>
            <a href={waLink(msg)} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp about ${name}`} title={`WhatsApp about ${name}`} onClick={() => trackContact("whatsapp", name)} className="inline-flex h-10 min-w-0 items-center justify-center gap-1 rounded-xl bg-whatsapp px-1 text-xs font-semibold text-whatsapp-foreground active:scale-95">
              <MessageCircle className="h-3.5 w-3.5 shrink-0" /><span className="hidden whitespace-nowrap sm:inline">WhatsApp</span>
            </a>
          </div>
        )}
      </div>
    </article>
  );
}

export function TrustSection() {
  const items = [
    { icon: ShieldCheck, title: "Inspect first", text: "Come see and test-drive before you pay a kobo." },
    { icon: BadgeCheck, title: "Real cars, real prices", text: "Every photo is the actual car. No bait prices." },
    { icon: FileCheck2, title: "Papers checked", text: "Customs duty and documents verified on every car." },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-3 sm:grid-cols-3">
        {items.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex gap-3 rounded-2xl bg-card p-4 shadow-card">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-primary"><Icon className="h-5 w-5" /></span>
            <div className="min-w-0">
              <h3 className="font-bold">{title}</h3>
              <p className="text-sm text-muted-foreground">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-brand text-brand-foreground">
      <div className="mx-auto max-w-6xl space-y-2 px-4 py-8 text-sm">
        <Logo />
        <p className="flex items-center gap-2 opacity-90"><MapPin className="h-4 w-4" />{BUSINESS.address}</p>
        <p className="opacity-90"><a href={telLink()} className="underline">{displayPhone()}</a></p>
        <p className="pt-2"><Link to="/request" className="font-semibold text-highlight underline">Can't find your car? Request it →</Link></p>
        <nav aria-label="Company" className="flex flex-wrap gap-x-5 gap-y-2 pt-3 text-sm">
          <Link to="/about" className="underline underline-offset-4">
            About us
          </Link>
          <Link to="/privacy" className="underline underline-offset-4">
            Privacy policy
          </Link>
          <Link to="/contact" className="underline underline-offset-4">
            Contact us
          </Link>
        </nav>
        <p className="pt-2 text-xs opacity-60">© {new Date().getFullYear()} {BUSINESS.name}. Abuja, Nigeria.</p>
      </div>
    </footer>
  );
}
