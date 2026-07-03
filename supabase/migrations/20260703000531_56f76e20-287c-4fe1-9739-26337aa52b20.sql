
CREATE TABLE public.shared_state (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shared_state TO anon, authenticated;
GRANT ALL ON public.shared_state TO service_role;
ALTER TABLE public.shared_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read shared_state" ON public.shared_state FOR SELECT USING (true);
CREATE POLICY "Public insert shared_state" ON public.shared_state FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update shared_state" ON public.shared_state FOR UPDATE USING (true) WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_state;
ALTER TABLE public.shared_state REPLICA IDENTITY FULL;
INSERT INTO public.shared_state (id, data) VALUES ('global', '{}'::jsonb) ON CONFLICT DO NOTHING;
