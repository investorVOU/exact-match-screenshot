import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter, SiteHeader } from "@/components/site";
import { BUSINESS, displayPhone, telLink } from "@/config/business";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Rush Autos" },
      { property: "og:title", content: "Privacy Policy — Rush Autos" },
      { property: "og:description", content: "How Rush Autos collects, uses, and protects information when you use our website." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "description",
        content:
          "How Rush Autos collects, uses, and protects information when you use our website.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen pb-nav">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <p className="text-sm font-bold uppercase text-primary">Your information</p>
        <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Privacy policy</h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated: October 6, 2026</p>
        <div className="mt-8 space-y-7 leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-bold text-foreground">Information we collect</h2>
            <p className="mt-2">
              When you submit a car request or inspection request, we collect the details you
              provide, such as your name, phone number, vehicle preferences, budget, and preferred
              inspection date. Our website may also collect basic usage and device information
              through cookies or similar technologies.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-foreground">How we use information</h2>
            <p className="mt-2">
              We use your information to respond to enquiries, process vehicle and inspection
              requests, improve our services, and understand how visitors use our website. We may
              use analytics and advertising measurement tools, including Google Analytics and Meta
              Pixel, when configured on the site.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-foreground">Sharing and storage</h2>
            <p className="mt-2">
              We do not sell your personal information. Information may be processed by service
              providers that help us operate the website, handle requests, or measure site
              performance. We retain information only as long as reasonably needed for these
              purposes, legal obligations, or resolving enquiries.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-foreground">Your choices</h2>
            <p className="mt-2">
              You can contact us to ask about, correct, or request deletion of personal information
              you have submitted. You can also limit cookies through your browser settings; some
              site features may not work as expected if you do.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-foreground">Contact</h2>
            <p className="mt-2">
              For privacy questions or requests, contact {BUSINESS.name} at{" "}
              <a href={telLink()} className="font-semibold text-primary underline">
                {displayPhone()}
              </a>
              .
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
