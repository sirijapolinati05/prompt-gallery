-- Create prompts table
CREATE TABLE IF NOT EXISTS public.prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT,
  prompt_text TEXT NOT NULL,
  ai_tool TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Men', 'Women', 'Couple', 'Kids')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Anyone can view prompts"
  ON public.prompts
  FOR SELECT
  USING (true);

-- Create policy for insert (we'll handle secret validation in the app)
CREATE POLICY "Anyone can insert prompts"
  ON public.prompts
  FOR INSERT
  WITH CHECK (true);

-- Create policy for update
CREATE POLICY "Anyone can update prompts"
  ON public.prompts
  FOR UPDATE
  USING (true);

-- Create policy for delete
CREATE POLICY "Anyone can delete prompts"
  ON public.prompts
  FOR DELETE
  USING (true);

-- Create storage bucket for prompt images
INSERT INTO storage.buckets (id, name, public)
VALUES ('prompt-images', 'prompt-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Anyone can view prompt images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'prompt-images');

CREATE POLICY "Anyone can upload prompt images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'prompt-images');

CREATE POLICY "Anyone can update prompt images"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'prompt-images');

CREATE POLICY "Anyone can delete prompt images"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'prompt-images');