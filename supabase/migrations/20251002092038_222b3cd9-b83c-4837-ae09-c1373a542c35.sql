-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Only admins can insert roles (will be enforced via has_role function)
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Update RLS policies on prompts table
DROP POLICY IF EXISTS "Anyone can insert prompts" ON public.prompts;
DROP POLICY IF EXISTS "Anyone can update prompts" ON public.prompts;
DROP POLICY IF EXISTS "Anyone can delete prompts" ON public.prompts;

-- Only admins can insert prompts
CREATE POLICY "Admins can insert prompts"
ON public.prompts
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete prompts
CREATE POLICY "Admins can delete prompts"
ON public.prompts
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update all fields
CREATE POLICY "Admins can update prompts"
ON public.prompts
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Anyone can update only the copy_count field
CREATE POLICY "Anyone can increment copy count"
ON public.prompts
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (
  -- Only allow updating copy_count, all other fields must remain the same
  copy_count > (SELECT copy_count FROM public.prompts WHERE id = prompts.id)
  AND image_url IS NOT DISTINCT FROM (SELECT image_url FROM public.prompts WHERE id = prompts.id)
  AND prompt_text IS NOT DISTINCT FROM (SELECT prompt_text FROM public.prompts WHERE id = prompts.id)
  AND ai_tool IS NOT DISTINCT FROM (SELECT ai_tool FROM public.prompts WHERE id = prompts.id)
  AND category IS NOT DISTINCT FROM (SELECT category FROM public.prompts WHERE id = prompts.id)
);