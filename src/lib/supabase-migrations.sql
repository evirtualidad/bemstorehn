-- Create a table for public user profiles
create table if not exists users (
  id uuid not null primary key,
  email text,
  role text,
  constraint id foreign key(id) references auth.users(id)
);

-- Function to automatically create a public user when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, role)
  values (new.id, new.email, 'cajero'); -- Default role is 'cajero'
  return new;
end;
$$;

-- Trigger to execute the function on new user creation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Disable Row-Level Security (RLS) for the users table
-- This is suitable for development but in production, you would
-- create specific policies to control access.
alter table public.users disable row level security;
