-- 1) Ensure helper extension for auto-updated timestamps exists
create extension if not exists moddatetime schema extensions;

-- 2) Create the profiles table
create table if not exists public.profiles (
  -- Link 1:1 to auth.users (the Supabase-managed users table)
  id uuid primary key references auth.users (id) on delete cascade,

  -- Your profile fields
  first_name text,
  surname    text,

  -- We store email here too (see notes below on duplication)
  email      text not null unique,

  -- Profile picture URL (can be Supabase Storage or any URL)
  avatar_url text,

  -- Timestamps
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- 3) Keep updated_at fresh automatically on any UPDATE
create trigger profiles_handle_updated_at
before update on public.profiles
for each row
execute procedure moddatetime (updated_at);

-- 4) Turn on Row Level Security (RLS)
alter table public.profiles enable row level security;

-- 5) Policies: each user can manage only their own profile
create policy "Users can insert their own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

create policy "Users can view their own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles
  for update
  using (auth.uid() = id);

-- 6) OPTIONAL BUT RECOMMENDED:
--    Auto-create a profiles row whenever a new auth user is created.
--    This avoids you having to insert from the client right after sign-up.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Create a minimal profile row pre-filled with id and email.
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();
