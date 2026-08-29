-- Employers may manage only their own jobs and their related required skills.
drop policy if exists jobs_employer_manage on public.jobs;
create policy jobs_employer_manage on public.jobs
for all
using ((employer_id = auth.uid() and public.is_employer()) or public.is_admin())
with check ((employer_id = auth.uid() and public.is_employer()) or public.is_admin());

drop policy if exists job_skills_employer_manage on public.job_skills;
create policy job_skills_employer_manage on public.job_skills
for all
using (exists (
  select 1 from public.jobs j
  where j.id = job_id
    and ((j.employer_id = auth.uid() and public.is_employer()) or public.is_admin())
))
with check (exists (
  select 1 from public.jobs j
  where j.id = job_id
    and ((j.employer_id = auth.uid() and public.is_employer()) or public.is_admin())
));