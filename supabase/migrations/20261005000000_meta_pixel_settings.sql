create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  pixel_id text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id, pixel_id)
values (1, '')
on conflict (id) do nothing;

grant select on public.site_settings to anon, authenticated;
grant insert, update on public.site_settings to authenticated;
grant all on public.site_settings to service_role;

alter table public.site_settings enable row level security;

create policy "Public reads site settings"
  on public.site_settings for select
  using (true);

create policy "Admins manage site settings"
  on public.site_settings for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));