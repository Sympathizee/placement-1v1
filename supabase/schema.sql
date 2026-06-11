-- Create the tournaments table
CREATE TABLE public.tournaments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    player1_name TEXT NOT NULL,
    player1_avatar TEXT,
    player1_description TEXT,
    player1_color TEXT,
    player2_name TEXT NOT NULL,
    player2_avatar TEXT,
    player2_description TEXT,
    player2_color TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed')),
    player1_score INTEGER NOT NULL DEFAULT 0,
    player2_score INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create the games table
CREATE TABLE public.games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    best_of INTEGER NOT NULL DEFAULT 3,
    order_index INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    image_url TEXT,
    player1_wins INTEGER NOT NULL DEFAULT 0,
    player2_wins INTEGER NOT NULL DEFAULT 0,
    winner_index INTEGER CHECK (winner_index IN (1, 2)),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create the matches table
CREATE TABLE public.matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
    match_number INTEGER NOT NULL,
    winner_index INTEGER NOT NULL CHECK (winner_index IN (1, 2)),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Create policies for tournaments

-- Spectators (anyone) can view tournaments
CREATE POLICY "Tournaments are viewable by everyone" ON public.tournaments
    FOR SELECT USING (true);

-- Only authenticated users (Admins) can insert/update tournaments
CREATE POLICY "Admins can insert tournaments" ON public.tournaments
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can update tournaments" ON public.tournaments
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Admins can delete tournaments" ON public.tournaments
    FOR DELETE TO authenticated USING (true);


-- Create policies for games

-- Spectators (anyone) can view games
CREATE POLICY "Games are viewable by everyone" ON public.games
    FOR SELECT USING (true);

-- Only authenticated users (Admins) can insert/update games
CREATE POLICY "Admins can insert games" ON public.games
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can update games" ON public.games
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Admins can delete games" ON public.games
    FOR DELETE TO authenticated USING (true);

-- Create policies for matches

-- Spectators (anyone) can view matches
CREATE POLICY "Matches are viewable by everyone" ON public.matches
    FOR SELECT USING (true);

-- Only authenticated users (Admins) can insert/update matches
CREATE POLICY "Admins can insert matches" ON public.matches
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can update matches" ON public.matches
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Admins can delete matches" ON public.matches
    FOR DELETE TO authenticated USING (true);

-- Enable Supabase Realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournaments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
