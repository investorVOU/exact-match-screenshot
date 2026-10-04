import { createFileRoute } from "@tanstack/react-router";
import { BUSINESS } from "@/config/business";
import { publicDb } from "@/lib/cars.server";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { data } = await publicDb().from("cars").select("slug,created_at").eq("status", "Available");
        const urls = [
          `<url><loc>${BUSINESS.siteUrl}/</loc><changefreq>daily</changefreq></url>`,
          `<url><loc>${BUSINESS.siteUrl}/request</loc></url>`,
          ...(data ?? []).map((c) => `<url><loc>${BUSINESS.siteUrl}/cars/${c.slug}</loc><lastmod>${c.created_at.slice(0, 10)}</lastmod></url>`),
        ];
        return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>`, {
          headers: { "content-type": "application/xml" },
        });
      },
    },
  },
});
