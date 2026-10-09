ALTER TABLE public.cars ADD COLUMN original_customs_duty boolean NOT NULL DEFAULT false;
CREATE TABLE public.customer_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text,
  car text,
  rating int NOT NULL,
  comment text NOT NULL,
  approved boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.customer_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_reviews TO authenticated;
GRANT ALL ON public.customer_reviews TO service_role;
ALTER TABLE public.customer_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public reads approved reviews" ON public.customer_reviews FOR SELECT USING (approved OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "anyone submits review" ON public.customer_reviews FOR INSERT TO anon, authenticated WITH CHECK (approved = true AND rating BETWEEN 1 AND 5 AND length(name) BETWEEN 1 AND 80 AND length(comment) BETWEEN 5 AND 800 AND coalesce(length(car),0) <= 100 AND coalesce(length(location),0) <= 60);
CREATE POLICY "admin manages reviews" ON public.customer_reviews FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin deletes reviews" ON public.customer_reviews FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));