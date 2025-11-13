-- Create profiles table
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  email text,
  display_name text,
  bio text,
  date_of_birth date,
  gender text,
  looking_for text,
  location text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  primary key (id)
);

alter table public.profiles enable row level security;

-- Create photos table
create table public.photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  photo_url text not null,
  display_order integer not null default 0,
  created_at timestamp with time zone default now(),
  unique(user_id, display_order)
);

alter table public.photos enable row level security;

-- Create interests table (predefined list)
create table public.interests (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text,
  created_at timestamp with time zone default now()
);

alter table public.interests enable row level security;

-- Create user_interests junction table
create table public.user_interests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  interest_id uuid not null references public.interests(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(user_id, interest_id)
);

alter table public.user_interests enable row level security;

-- Create matches table
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  liked_user_id uuid not null references public.profiles(id) on delete cascade,
  is_match boolean default false,
  created_at timestamp with time zone default now(),
  unique(user_id, liked_user_id),
  check (user_id != liked_user_id)
);

alter table public.matches enable row level security;

-- Create messages table
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  read boolean default false,
  created_at timestamp with time zone default now(),
  check (sender_id != receiver_id)
);

alter table public.messages enable row level security;

-- Create function to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

-- Trigger to auto-create profile
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Trigger for profiles updated_at
create trigger on_profile_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- Create security definer function to check if users are matched
create or replace function public.are_users_matched(_user1_id uuid, _user2_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.matches
    where (user_id = _user1_id and liked_user_id = _user2_id and is_match = true)
       or (user_id = _user2_id and liked_user_id = _user1_id and is_match = true)
  )
$$;

-- RLS Policies for profiles
create policy "Users can view all profiles"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- RLS Policies for photos
create policy "Anyone can view photos"
  on public.photos for select
  to authenticated
  using (true);

create policy "Users can insert own photos"
  on public.photos for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own photos"
  on public.photos for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete own photos"
  on public.photos for delete
  to authenticated
  using (auth.uid() = user_id);

-- RLS Policies for interests
create policy "Anyone can view interests"
  on public.interests for select
  to authenticated
  using (true);

-- RLS Policies for user_interests
create policy "Anyone can view user interests"
  on public.user_interests for select
  to authenticated
  using (true);

create policy "Users can insert own interests"
  on public.user_interests for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete own interests"
  on public.user_interests for delete
  to authenticated
  using (auth.uid() = user_id);

-- RLS Policies for matches
create policy "Users can view own matches"
  on public.matches for select
  to authenticated
  using (auth.uid() = user_id or auth.uid() = liked_user_id);

create policy "Users can insert own matches"
  on public.matches for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own matches"
  on public.matches for update
  to authenticated
  using (auth.uid() = user_id);

-- RLS Policies for messages
create policy "Users can view messages in their conversations"
  on public.messages for select
  to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send messages to matched users"
  on public.messages for insert
  to authenticated
  with check (
    auth.uid() = sender_id 
    and public.are_users_matched(sender_id, receiver_id)
  );

create policy "Users can update own sent messages"
  on public.messages for update
  to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Create storage bucket for profile photos
insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true);

-- Storage policies for profile photos
create policy "Users can view all profile photos"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'profile-photos');

create policy "Users can upload own profile photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'profile-photos' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update own profile photos"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'profile-photos' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own profile photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'profile-photos' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Insert some default interests
insert into public.interests (name, category) values
  ('Hiking', 'Outdoors'),
  ('Reading', 'Hobbies'),
  ('Cooking', 'Hobbies'),
  ('Travel', 'Lifestyle'),
  ('Movies', 'Entertainment'),
  ('Music', 'Entertainment'),
  ('Fitness', 'Health'),
  ('Yoga', 'Health'),
  ('Photography', 'Creative'),
  ('Art', 'Creative'),
  ('Gaming', 'Entertainment'),
  ('Dancing', 'Activities'),
  ('Pets', 'Lifestyle'),
  ('Coffee', 'Food & Drink'),
  ('Wine', 'Food & Drink');

-- Enable realtime for messages
alter publication supabase_realtime add table public.messages;