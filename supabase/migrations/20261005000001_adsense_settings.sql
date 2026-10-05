alter table public.site_settings
  add column if not exists adsense_client_id text not null default '';