alter table public.site_settings
  add column if not exists google_analytics_id text not null default '';