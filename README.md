# Rush Autos

Car listings for Rush Autos in Abuja, built with TanStack Start, React, and Supabase.

## Local development

Requires Node.js 22 or later.

```sh
npm install
npm run dev
```

Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in the environment. Add all five to Render when prompted; the service-role key is secret and must never use a `VITE_` prefix.

## Deploy to Render

This repository includes a Render Blueprint in `render.yaml`. In Render, create a new Blueprint and select this repository. Add the Supabase values when prompted, then deploy. The app runs as a Node web service using Nitro's `node-server` preset.

Update the business phone, address, site URL, and other public business details in `src/config/business.ts` before going live. Configure Supabase authentication, database policies, and storage for the production domain as well.
