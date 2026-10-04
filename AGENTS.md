<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Rush Autos decisions
- Business settings (phone, pixel, address, site URL) live only in src/config/business.ts — one place for the owner to edit.
- Public car reads go through server functions in src/lib/cars.functions.ts using a publishable-key client, so listing and car pages SSR with OG tags.
- Admin pages use the browser client with RLS; admin role is in user_roles and the first signed-up account becomes admin via trigger.
- car-images bucket is private (workspace blocks public buckets); uploads store a long-lived signed URL in car_images.url plus the storage path.
- Meta Pixel calls go through src/lib/pixel.ts which no-ops when the ID is missing or blocked.
