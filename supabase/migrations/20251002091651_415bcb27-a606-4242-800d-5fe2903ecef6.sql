-- Add copy_count column to prompts table
ALTER TABLE public.prompts 
ADD COLUMN copy_count INTEGER DEFAULT 0 NOT NULL;

-- Create index for better performance when sorting by copy_count
CREATE INDEX idx_prompts_copy_count ON public.prompts(copy_count DESC);