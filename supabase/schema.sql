-- SkillTrack database foundation.
-- Run manually in the Supabase SQL Editor. This file is intentionally not executed by the app.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role text not null default 'student' check (role in ('student', 'employer', 'admin')),
  phone text,
  location text,
  education text,
  career_goal text,
  bio text,
  profile_completion integer not null default 0 check (profile_completion between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(), name text not null unique, category text,
  description text, target_score integer not null default 80 check (target_score between 0 and 100), created_at timestamptz not null default now()
);
create table if not exists public.skill_progress (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade, current_score integer not null default 0,
  target_score integer not null default 80, gap_percentage integer not null default 80, last_assessed_at timestamptz,
  updated_at timestamptz not null default now(), unique (user_id, skill_id)
);
create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(), skill_id uuid references public.skills(id) on delete cascade,
  title text not null, description text, duration_minutes integer, question_count integer, created_at timestamptz not null default now()
);
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(), skill_id uuid references public.skills(id) on delete cascade,
  question_text text not null, option_a text, option_b text, option_c text, option_d text,
  correct_option text, topic text, difficulty text, created_at timestamptz not null default now(), unique (skill_id, topic)
);
create table if not exists public.assessment_attempts (
  id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade,
  assessment_id uuid references public.assessments(id) on delete cascade, score integer not null default 0,
  total_questions integer not null default 0, correct_answers integer not null default 0, percentage integer not null default 0,
  performance_level text, started_at timestamptz not null default now(), completed_at timestamptz
);
create table if not exists public.assessment_answers (
  id uuid primary key default gen_random_uuid(), attempt_id uuid not null references public.assessment_attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade, selected_option text, is_correct boolean not null default false,
  created_at timestamptz not null default now(), unique (attempt_id, question_id)
);
create table if not exists public.learning_resources (
  id uuid primary key default gen_random_uuid(), skill_id uuid references public.skills(id) on delete cascade,
  title text not null, description text, level text, estimated_minutes integer, resource_url text, created_at timestamptz not null default now()
);
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(), employer_id uuid references auth.users(id) on delete set null,
  title text not null, company_name text not null, location text, description text, experience_required text,
  employment_type text, salary_range text, status text not null default 'Active', created_at timestamptz not null default now()
);
create table if not exists public.job_skills (
  id uuid primary key default gen_random_uuid(), job_id uuid references public.jobs(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete cascade, minimum_score integer not null default 60,
  unique (job_id, skill_id)
);
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(), job_id uuid references public.jobs(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade, status text not null default 'Applied',
  applied_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (job_id, user_id)
);
create table if not exists public.certifications (
  id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete set null, name text, score integer,
  issued_at timestamptz, certificate_number text, status text not null default 'Active'
);

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;
create or replace function public.is_employer() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'employer');
$$;
create or replace function public.calculate_profile_completion() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    new.profile_completion := 0;
  else
    new.profile_completion := round((array_length(array_remove(array[new.full_name, new.phone, new.location, new.education, new.career_goal, new.bio], null), 1)::numeric / 6) * 100);
  end if;
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists profiles_completion on public.profiles;
create trigger profiles_completion before insert or update on public.profiles for each row execute procedure public.calculate_profile_completion();
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), new.email, coalesce(new.raw_user_meta_data ->> 'role', 'student'))
  on conflict (id) do nothing;
  exception when others then
    raise warning 'Unable to create profile for auth user %: %', new.id, sqlerrm;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at := now(); return new; end; $$;
drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute procedure public.touch_updated_at();
drop trigger if exists skill_progress_updated_at on public.skill_progress;
create trigger skill_progress_updated_at before update on public.skill_progress for each row execute procedure public.touch_updated_at();
drop trigger if exists applications_updated_at on public.applications;
create trigger applications_updated_at before update on public.applications for each row execute procedure public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.skills enable row level security;
alter table public.skill_progress enable row level security;
alter table public.assessments enable row level security;
alter table public.questions enable row level security;
alter table public.assessment_attempts enable row level security;
alter table public.assessment_answers enable row level security;
alter table public.learning_resources enable row level security;
alter table public.jobs enable row level security;
alter table public.job_skills enable row level security;
alter table public.applications enable row level security;
alter table public.certifications enable row level security;

create policy profiles_select_own on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy profiles_update_own on public.profiles for update using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());
create policy profiles_admin_all on public.profiles for all using (public.is_admin()) with check (public.is_admin());
create policy skills_authenticated_read on public.skills for select using (auth.uid() is not null);
create policy skills_admin_write on public.skills for all using (public.is_admin()) with check (public.is_admin());
create policy progress_own_read on public.skill_progress for select using (user_id = auth.uid() or public.is_admin());
create policy progress_own_write on public.skill_progress for insert with check (user_id = auth.uid());
create policy progress_own_update on public.skill_progress for update using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy assessments_authenticated_read on public.assessments for select using (auth.uid() is not null);
create policy assessments_admin_write on public.assessments for all using (public.is_admin()) with check (public.is_admin());
create policy questions_authenticated_read on public.questions for select using (auth.uid() is not null);
create policy questions_admin_write on public.questions for all using (public.is_admin()) with check (public.is_admin());
create policy attempts_own_read on public.assessment_attempts for select using (user_id = auth.uid() or public.is_admin());
create policy attempts_own_insert on public.assessment_attempts for insert with check (user_id = auth.uid());
create policy attempts_admin_all on public.assessment_attempts for all using (public.is_admin()) with check (public.is_admin());
create policy answers_own_read on public.assessment_answers for select using (exists (select 1 from public.assessment_attempts a where a.id = attempt_id and a.user_id = auth.uid()) or public.is_admin());
create policy answers_own_insert on public.assessment_answers for insert with check (exists (select 1 from public.assessment_attempts a where a.id = attempt_id and a.user_id = auth.uid()));
create policy answers_admin_all on public.assessment_answers for all using (public.is_admin()) with check (public.is_admin());
create policy resources_authenticated_read on public.learning_resources for select using (auth.uid() is not null);
create policy resources_admin_write on public.learning_resources for all using (public.is_admin()) with check (public.is_admin());
create policy jobs_active_read on public.jobs for select using (status = 'Active' and auth.uid() is not null or employer_id = auth.uid() or public.is_admin());
create policy jobs_employer_write on public.jobs for insert with check (employer_id = auth.uid() and public.is_employer());
create policy jobs_owner_update on public.jobs for update using (employer_id = auth.uid() or public.is_admin()) with check (employer_id = auth.uid() or public.is_admin());
create policy jobs_owner_delete on public.jobs for delete using (employer_id = auth.uid() or public.is_admin());
create policy job_skills_authenticated_read on public.job_skills for select using (auth.uid() is not null);
create policy job_skills_owner_write on public.job_skills for all using (exists (select 1 from public.jobs j where j.id = job_id and (j.employer_id = auth.uid() or public.is_admin()))) with check (exists (select 1 from public.jobs j where j.id = job_id and (j.employer_id = auth.uid() or public.is_admin())));
create policy applications_own_or_employer_read on public.applications for select using (user_id = auth.uid() or exists (select 1 from public.jobs j where j.id = job_id and j.employer_id = auth.uid()) or public.is_admin());
create policy applications_own_insert on public.applications for insert with check (user_id = auth.uid());
create policy applications_employer_update on public.applications for update using (exists (select 1 from public.jobs j where j.id = job_id and j.employer_id = auth.uid()) or public.is_admin()) with check (exists (select 1 from public.jobs j where j.id = job_id and j.employer_id = auth.uid()) or public.is_admin());
create policy applications_admin_all on public.applications for all using (public.is_admin()) with check (public.is_admin());
create policy certifications_own_read on public.certifications for select using (user_id = auth.uid() or public.is_admin());
create policy certifications_admin_write on public.certifications for all using (public.is_admin()) with check (public.is_admin());

-- Fictional demo seed data. No government or employment claims are represented.
insert into public.skills (name, category, description, target_score) values
 ('HTML','Frontend','Semantic structure and accessible markup',80), ('CSS','Frontend','Responsive layout and visual systems',80),
 ('JavaScript','Frontend','Modern browser programming and asynchronous logic',80), ('React','Frontend','Component architecture and state management',80),
 ('Java','Backend','Object-oriented application development',75), ('SQL','Data','Relational querying and data modeling',75),
 ('Communication','Professional','Clear written and spoken collaboration',75)
on conflict (name) do nothing;
insert into public.assessments (skill_id, title, description, duration_minutes, question_count)
select id, name || ' Skills Check', 'A focused diagnostic for your current ' || name || ' capability.', 12, 10
from public.skills where category in ('Frontend','Backend','Data') and not exists (select 1 from public.assessments a where a.skill_id = public.skills.id);
insert into public.learning_resources (skill_id, title, description, level, estimated_minutes, resource_url)
select s.id, r.title, r.description, r.level, r.minutes, r.url from public.skills s cross join (values
 ('Foundations module','Build a reliable foundation with guided practice.','Beginner',45,'https://developer.mozilla.org/'),
 ('Applied practice lab','Apply the skill to a realistic product scenario.','Intermediate',60,'https://www.freecodecamp.org/'),
 ('Advanced challenge','Stretch your reasoning with an assessment-style challenge.','Advanced',90,'https://web.dev/')
) r(title,description,level,minutes,url) where not exists (select 1 from public.learning_resources lr where lr.skill_id = s.id and lr.title = r.title);
-- Create five fictional jobs after an employer profile/user exists; employer_id must be supplied by the operator.
-- Example (run after replacing the UUID):
-- insert into public.jobs (employer_id,title,company_name,location,description,experience_required,employment_type,status)
-- values ('EMPLOYER_AUTH_USER_UUID','Frontend Developer','Northstar Demo Labs','Remote','Fictional demo role.','1-3 years','Full-time','Active');
