-- Add new profile fields
ALTER TABLE public.profiles 
ADD COLUMN height TEXT,
ADD COLUMN occupation TEXT,
ADD COLUMN education TEXT,
ADD COLUMN relationship_goal TEXT,
ADD COLUMN smoking TEXT,
ADD COLUMN drinking TEXT,
ADD COLUMN religion TEXT;