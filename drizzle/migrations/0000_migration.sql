create type public.app_role as enum ('admin','user');
create table public.user_roles (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, role app_role not null, unique(user_id, role));
grant select on public.user_roles to authenticated; grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create or replace function public.has_role(_user_id uuid, _role app_role) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.user_roles where user_id=_user_id and role=_role) $$;
create policy "own roles readable" on public.user_roles for select to authenticated using (user_id = auth.uid());
create or replace function public.admin_exists() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.user_roles where role='admin') $$;
grant execute on function public.admin_exists() to anon, authenticated;

create table public.cars (
 id uuid primary key default gen_random_uuid(), slug text not null unique, make text not null, model text not null, year int not null, price bigint not null,
 mileage int not null default 0, transmission text not null default 'Automatic', fuel text not null default 'Petrol', body_type text not null default 'Sedan',
 condition text not null default 'Foreign Used', color text, engine_size text, location text not null default 'Abuja', description text,
 status text not null default 'Available', created_at timestamptz not null default now());
grant select on public.cars to anon, authenticated; grant insert, update, delete on public.cars to authenticated; grant all on public.cars to service_role;
alter table public.cars enable row level security;
create policy "public reads cars" on public.cars for select using (status in ('Available','Sold') or public.has_role(auth.uid(),'admin'));
create policy "admin writes cars" on public.cars for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create index cars_status_created on public.cars(status, created_at desc);

create table public.car_images (id uuid primary key default gen_random_uuid(), car_id uuid not null references public.cars(id) on delete cascade, url text not null, path text, position int not null default 0);
grant select on public.car_images to anon, authenticated; grant insert, update, delete on public.car_images to authenticated; grant all on public.car_images to service_role;
alter table public.car_images enable row level security;
create policy "public reads images" on public.car_images for select using (true);
create policy "admin writes images" on public.car_images for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create index car_images_car on public.car_images(car_id, position);

create table public.inspection_requests (id uuid primary key default gen_random_uuid(), car_id uuid references public.cars(id) on delete set null, name text not null, preferred_date date, status text not null default 'New', created_at timestamptz not null default now());
grant insert on public.inspection_requests to anon, authenticated; grant select, update, delete on public.inspection_requests to authenticated; grant all on public.inspection_requests to service_role;
alter table public.inspection_requests enable row level security;
create policy "anyone inserts inspection" on public.inspection_requests for insert to anon, authenticated with check (status = 'New' and length(name) between 1 and 100);
create policy "admin reads inspection" on public.inspection_requests for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin updates inspection" on public.inspection_requests for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin deletes inspection" on public.inspection_requests for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.car_requests (id uuid primary key default gen_random_uuid(), name text not null, phone text not null, car_wanted text not null, budget text, type text, status text not null default 'New', created_at timestamptz not null default now());
grant insert on public.car_requests to anon, authenticated; grant select, update, delete on public.car_requests to authenticated; grant all on public.car_requests to service_role;
alter table public.car_requests enable row level security;
create policy "anyone inserts car request" on public.car_requests for insert to anon, authenticated with check (status = 'New' and length(name) between 1 and 100 and length(phone) between 5 and 30 and length(car_wanted) between 1 and 200);
create policy "admin reads car requests" on public.car_requests for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin updates car requests" on public.car_requests for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin deletes car requests" on public.car_requests for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create policy "read car images objects" on storage.objects for select using (bucket_id = 'car-images');
create policy "admin upload car images" on storage.objects for insert to authenticated with check (bucket_id = 'car-images' and public.has_role(auth.uid(),'admin'));
create policy "admin update car images" on storage.objects for update to authenticated using (bucket_id = 'car-images' and public.has_role(auth.uid(),'admin'));
create policy "admin delete car images" on storage.objects for delete to authenticated using (bucket_id = 'car-images' and public.has_role(auth.uid(),'admin'));

create or replace function public.grant_first_admin() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if not exists (select 1 from public.user_roles where role='admin') then
    insert into public.user_roles(user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_admin after insert on auth.users for each row execute function public.grant_first_admin();

insert into public.cars (slug, make, model, year, price, mileage, transmission, fuel, body_type, condition, color, engine_size, location, description, created_at) values
('2015-toyota-camry-xle','Toyota','Camry XLE',2015,9500000,98000,'Automatic','Petrol','Sedan','Foreign Used','Silver','2.5L','Ikeja, Abuja','Clean Tokunbo Camry XLE. Leather seats, reverse camera, keyless entry. Duty fully paid.', now() - interval '1 day'),
('2012-toyota-corolla-le','Toyota','Corolla LE',2012,5200000,142000,'Automatic','Petrol','Sedan','Nigerian Used','Black','1.8L','Lekki, Abuja','Neatly used Corolla, buy and drive. AC chilling, no fault.', now() - interval '2 days'),
('2016-toyota-highlander-limited','Toyota','Highlander Limited',2016,21500000,87000,'Automatic','Petrol','SUV','Foreign Used','White','3.5L V6','Ikeja, Abuja','Full option Highlander Limited. Panoramic roof, 3rd row seats, push start.', now() - interval '3 days'),
('2018-toyota-hilux','Toyota','Hilux',2018,24000000,64000,'Manual','Diesel','Pickup','Foreign Used','Grey','2.8L','Apapa, Abuja','Strong diesel Hilux double cabin. Perfect for work and site.', now() - interval '4 days'),
('2014-lexus-rx-350','Lexus','RX 350',2014,14800000,110000,'Automatic','Petrol','SUV','Foreign Used','Pearl White','3.5L V6','Lekki, Abuja','Tokunbo RX 350 with navigation, leather, sunroof. Very clean.', now() - interval '5 days'),
('2013-lexus-es-350','Lexus','ES 350',2013,9800000,125000,'Automatic','Petrol','Sedan','Nigerian Used','Gold','3.5L V6','Surulere, Abuja','Smooth ES 350, first body. Engine and gear perfect.', now() - interval '6 days'),
('2017-honda-accord-sport','Honda','Accord Sport',2017,13200000,76000,'Automatic','Petrol','Sedan','Foreign Used','Blue','2.4L','Ikeja, Abuja','Accord Sport with alloy wheels, Apple CarPlay, lane watch camera.', now() - interval '7 days'),
('2015-honda-cr-v-ex','Honda','CR-V EX',2015,11500000,99000,'Automatic','Petrol','SUV','Nigerian Used','Red','2.4L','Ajah, Abuja','Reliable family SUV. Sunroof, reverse camera, low fuel use.', now() - interval '8 days'),
('2016-mercedes-benz-c300','Mercedes-Benz','C300',2016,18900000,72000,'Automatic','Petrol','Sedan','Foreign Used','Black','2.0L Turbo','Victoria Island, Abuja','Tokunbo C300 4MATIC. Ambient lights, leather, Burmester sound.', now() - interval '9 days'),
('2017-ford-explorer-xlt','Ford','Explorer XLT',2017,16500000,91000,'Automatic','Petrol','SUV','Foreign Used','Grey','3.5L V6','Ikeja, Abuja','7-seater Explorer XLT. Spacious, strong engine, ice-cold AC.', now() - interval '10 days');

insert into public.car_images (car_id, url, position) select id, '/cars/' || slug || '.jpg', 0 from public.cars;