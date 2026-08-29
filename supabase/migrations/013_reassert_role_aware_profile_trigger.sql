-- Ensure newly registered public accounts retain their selected Student/Employer role.
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
    case
      when lower(coalesce(new.raw_user_meta_data ->> 'role', 'student')) = 'employer'
        then 'employer'::public.user_role
      else 'student'::public.user_role
    end
  )
  on conflict (id) do nothing;
  return new;
exception when others then
  raise warning 'Unable to create profile for auth user %: %', new.id, sqlerrm;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();