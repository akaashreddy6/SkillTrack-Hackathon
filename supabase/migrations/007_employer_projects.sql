-- Employer workflow and student portfolio persistence.
alter table public.jobs add column if not exists responsibilities text;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  technologies text,
  github_url text,
  live_demo_url text,
  image_url text,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.project_skills (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  skill_id bigint not null references public.skills(id) on delete cascade,
  unique (project_id, skill_id)
);

drop trigger if exists projects_updated_at on public.projects;
create trigger projects_updated_at before update on public.projects for each row execute procedure public.touch_updated_at();

alter table public.projects enable row level security;
alter table public.project_skills enable row level security;
drop policy if exists projects_owner_read on public.projects;
create policy projects_owner_read on public.projects for select using (user_id = auth.uid());
drop policy if exists projects_owner_insert on public.projects;
create policy projects_owner_insert on public.projects for insert with check (user_id = auth.uid());
drop policy if exists projects_owner_update on public.projects;
create policy projects_owner_update on public.projects for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists projects_owner_delete on public.projects;
create policy projects_owner_delete on public.projects for delete using (user_id = auth.uid());
drop policy if exists project_skills_owner_read on public.project_skills;
create policy project_skills_owner_read on public.project_skills for select using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));
drop policy if exists project_skills_owner_insert on public.project_skills;
create policy project_skills_owner_insert on public.project_skills for insert with check (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));
drop policy if exists project_skills_owner_delete on public.project_skills;
create policy project_skills_owner_delete on public.project_skills for delete using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));

drop policy if exists applications_employer_update on public.applications;
create policy applications_employer_update on public.applications for update using (exists (select 1 from public.jobs j where j.id = job_id and j.employer_id = auth.uid())) with check (exists (select 1 from public.jobs j where j.id = job_id and j.employer_id = auth.uid()));

drop policy if exists profiles_employer_candidate_read on public.profiles;
create policy profiles_employer_candidate_read on public.profiles for select using (
  id = auth.uid() or public.is_admin() or exists (
    select 1 from public.applications a join public.jobs j on j.id = a.job_id
    where a.user_id = profiles.id and j.employer_id = auth.uid()
  )
);

do $$ begin
  alter type public.application_status add value if not exists 'Under Review';
exception when undefined_object then null;
end $$;