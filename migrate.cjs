const { Client } = require('pg');
const client = new Client('postgresql://postgres:9mXSLlTUWKMM2ELy@db.jhfxsbirrrvdwuybjijb.supabase.co:5432/postgres');

client.connect()
  .then(() => {
    const sql = `
      ALTER TABLE public.games ADD COLUMN IF NOT EXISTS image_url TEXT;

      CREATE TABLE IF NOT EXISTS public.matches (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
          match_number INTEGER NOT NULL,
          winner_index INTEGER NOT NULL CHECK (winner_index IN (1, 2)),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );

      ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Matches are viewable by everyone" ON public.matches;
      CREATE POLICY "Matches are viewable by everyone" ON public.matches FOR SELECT USING (true);

      DROP POLICY IF EXISTS "Admins can insert matches" ON public.matches;
      CREATE POLICY "Admins can insert matches" ON public.matches FOR INSERT TO authenticated WITH CHECK (true);

      DROP POLICY IF EXISTS "Admins can update matches" ON public.matches;
      CREATE POLICY "Admins can update matches" ON public.matches FOR UPDATE TO authenticated USING (true);

      DROP POLICY IF EXISTS "Admins can delete matches" ON public.matches;
      CREATE POLICY "Admins can delete matches" ON public.matches FOR DELETE TO authenticated USING (true);

      ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
    `;
    return client.query(sql);
  })
  .then(() => console.log('Schema changes applied'))
  .catch(console.error)
  .finally(() => client.end());
