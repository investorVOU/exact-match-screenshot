INSERT INTO public.customer_reviews (id, name, location, car, rating, comment, approved, created_at)
VALUES
  (gen_random_uuid(), 'Ada N.', 'Abuja', '2019 Toyota Corolla', 5, 'The car was exactly as described and very clean. The team explained everything clearly and the inspection process was smooth.', true, now() - interval '20 days'),
  (gen_random_uuid(), 'Musa K.', 'Lagos', '2021 Honda Civic', 5, 'I found the car I wanted quickly and the pricing felt fair. Delivery and paperwork were handled professionally.', true, now() - interval '14 days'),
  (gen_random_uuid(), 'Faith O.', 'Kano', '2020 Toyota Highlander', 4, 'Great communication, no hidden surprises, and the vehicle looked even better in person. I would recommend Rush Autos.', true, now() - interval '7 days');
