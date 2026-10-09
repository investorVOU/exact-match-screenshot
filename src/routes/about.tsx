import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter, SiteHeader } from "@/components/site";
import { BUSINESS, displayPhone, telLink } from "@/config/business";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Rush Autos — Quality Cars. Better Rides." },
      { property: "og:title", content: "About Rush Autos — Quality Cars. Better Rides." },
      { property: "og:description", content: "Learn how Rush Autos helps individuals, families, and businesses find quality cars in Nigeria." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "description",
        content:
          "Learn how Rush Autos helps individuals, families, and businesses find quality cars in Nigeria.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen pb-nav">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <p className="text-sm font-bold uppercase text-primary">Rush Autos</p>
        <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">About us</h1>
        <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground">
          <p>
            At <strong className="text-foreground">Rush Autos</strong>, we make finding the right
            car simple, transparent, and stress-free.
          </p>
          <p>
            We are an automotive dealership focused on providing quality vehicles to individuals,
            families, and businesses across Nigeria. From everyday cars to premium SUVs and luxury
            vehicles, we carefully source and offer vehicles that combine{" "}
            <strong className="text-foreground">quality, reliability, comfort, and value.</strong>
          </p>
          <p>
            Our goal is more than just selling cars. We want every customer to feel confident about
            their purchase and receive a vehicle that meets their needs and expectations.
          </p>
          <p>
            Whether you're looking for your first car, upgrading to something better, or searching
            for a premium vehicle,{" "}
            <strong className="text-foreground">
              Rush Autos is ready to help you find your next ride.
            </strong>
          </p>
        </div>
        <p className="mt-8 font-display text-xl font-extrabold text-primary">
          Rush Autos — Quality Cars. Better Rides.
        </p>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
          <a href={BUSINESS.siteUrl} className="text-primary underline">
            rushautos.com.ng
          </a>
          <a href={telLink()} className="text-primary underline">
            {displayPhone()}
          </a>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
