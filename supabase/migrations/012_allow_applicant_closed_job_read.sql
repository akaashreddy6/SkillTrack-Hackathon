-- Let a student review a job they already applied to after it is closed.
create or replace function public.has_applied_to_job(p_job_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.applications
    where job_id = p_job_id
      and user_id = auth.uid()
  );
$$;

drop policy if exists jobs_active_read on public.jobs;
create policy jobs_active_read on public.jobs
for select
using (
  (status = 'Active' and auth.uid() is not null)
  or employer_id = auth.uid()
  or public.is_admin()
  or public.has_applied_to_job(id)
);