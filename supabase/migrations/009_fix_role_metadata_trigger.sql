-- Fix: Read role from auth.users metadata during profile creation.
-- Previously, the handle_new_user() trigger only read 'full_name' from metadata
-- and ignored the 'role' field, causing all new profiles to be created with the default 'student' role.
-- This migration updates the trigger to properly read the role from metadata.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'student')
  )
  on conflict (id) do nothing;
  exception when others then
    raise warning 'Unable to create profile for auth user %: %', new.id, sqlerrm;
  return new;
end;
$$;
