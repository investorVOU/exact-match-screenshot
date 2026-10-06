import { createFileRoute } from "@tanstack/react-router";
import { Globe, MapPin, MessageCircle, Phone } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site";
import { BUSINESS, displayPhone, telLink, waLink } from "@/config/business";
import { trackContact } from "@/lib/pixel";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Rush Autos" },
      { name: "description", content: "Call or WhatsApp Rush Autos for help finding your next car." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="min-h-screen pb-nav">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <p className="text-sm font-bold uppercase text-primary">We’re here to help</p>
        <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Contact us</h1>
        <p className="mt-3 max-w-xl leading-relaxed text-muted-foreground">Talk to Rush Autos about a vehicle, arranging an inspection, or finding the right car for you.</p>
        <div className="mt-8 divide-y divide-border border-y border-border">
          <a href={telLink()} onClick={() => trackContact("call")} className="flex items-center gap-4 py-5">
            <Phone className="h-5 w-5 shrink-0 text-primary" />
            <span><span className="block text-sm text-muted-foreground">Call us</span><span className="font-semibold">{displayPhone()}</span></span>
          </a>
          <a href={waLink("Hello Rush Autos, I'd like to make an enquiry.")} target="_blank" rel="noopener noreferrer" onClick={() => trackContact("whatsapp")} className="flex items-center gap-4 py-5">
            <MessageCircle className="h-5 w-5 shrink-0 text-primary" />
            <span><span className="block text-sm text-muted-foreground">WhatsApp</span><span className="font-semibold">Chat with our team</span></span>
          </a>
          <p className="flex items-center gap-4 py-5">
            <MapPin className="h-5 w-5 shrink-0 text-primary" />
            <span><span className="block text-sm text-muted-foreground">Visit us</span><span className="font-semibold">{BUSINESS.address}</span></span>
          </p>
          <a href={BUSINESS.siteUrl} className="flex items-center gap-4 py-5">
            <Globe className="h-5 w-5 shrink-0 text-primary" />
            <span><span className="block text-sm text-muted-foreground">Website</span><span className="font-semibold">rushautos.com.ng</span></span>
          </a>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}