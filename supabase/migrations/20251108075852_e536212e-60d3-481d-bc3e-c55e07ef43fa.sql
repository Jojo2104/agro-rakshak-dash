-- Create user_profile table
CREATE TABLE public.user_profile (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  region text NOT NULL,
  soil_type text NOT NULL,
  crop text NOT NULL,
  season text NOT NULL,
  pincode text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;

-- Create policies for user profile access
CREATE POLICY "Users can view their own profile" 
ON public.user_profile 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.user_profile 
FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.user_profile 
FOR UPDATE 
USING (auth.uid() = id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_profile_updated_at
BEFORE UPDATE ON public.user_profile
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();