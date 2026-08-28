-- Ensures every newly created Supabase Auth user receives one student profile.
-- Run manually in the Supabase SQL Editor. Existing profiles are not modified or deleted.

create or replace function public.calculate_profile_completion()
returns trigger
language plpgsql
as $$
begin
  -- New accounts start at zero; later profile edits calculate completion.
  if tg_op = 'INSERT' then
    new.profile_completion := 0;
  else
    new.profile_completion := round((array_length(array_remove(array[
      new.full_name, new.phone, new.location, new.education, new.career_goal, new.bio
    ], null), 1)::numeric / 6) * 100);
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_completion on public.profiles;
create trigger profiles_completion
before insert or update on public.profiles
for each row execute procedure public.calculate_profile_completion();

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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Trigger functions run inside the database; the browser never receives a service-role key.