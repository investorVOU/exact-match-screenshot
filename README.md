# Rush Autos

Car listings for Rush Autos in Abuja, built with TanStack Start, React, and Supabase.

## Local development

Requires Node.js 22 or later.

```sh
npm install
npm run dev
```

Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `META_CONVERSIONS_API_ACCESS_TOKEN` in Render. For the admin "Fill with AI" button on Render, also set `GROQ_API_KEY` (optional `GROQ_MODEL`, default `qwen/qwen3.8-27b`). The service-role key, Meta access token, and Groq API key are secret and must never use a `VITE_` prefix.

## Deploy to Render

This repository includes a Render Blueprint in `render.yaml`. In Render, create a new Blueprint and select this repository. Add the Supabase values when prompted, then deploy. The app runs as a Node web service using Nitro's `node-server` preset.

Apply the SQL migrations in `supabase/migrations/` to the Supabase project before using **Admin → Settings**. Enter the numeric Pixel ID there. To configure AdSense, paste the publisher ID or the code snippet from Google AdSense; the site installs the standard AdSense loader and verification meta tag. To configure Google Analytics, paste the GA4 Measurement ID or Google tag snippet; the site tracks public-page views across client-side navigation. Create a Conversions API access token in Meta Events Manager and store it in Render as `META_CONVERSIONS_API_ACCESS_TOKEN`. To validate events in Meta, temporarily set `META_TEST_EVENT_CODE` in Render and remove it after testing.

Update the business phone, address, site URL, and other public business details in `src/config/business.ts` before going live. Configure Supabase authentication, database policies, and storage for the production domain as well.
