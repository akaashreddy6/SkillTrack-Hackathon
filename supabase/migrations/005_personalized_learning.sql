-- Persist deterministic topic recommendations and each learner's progress.
create table if not exists public.learning_topics (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references public.skills(id) on delete cascade,
  topic text not null,
  difficulty text not null default 'Intermediate',
  estimated_minutes integer not null default 30,
  phase text not null default 'Core Skills',
  created_at timestamptz not null default now(),
  unique (skill_id, topic)
);

create table if not exists public.learning_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  learning_topic_id uuid not null references public.learning_topics(id) on delete cascade,
  progress integer not null default 0 check (progress between 0 and 100),
  status text not null default 'Not started' check (status in ('Not started', 'In progress', 'Completed')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, learning_topic_id)
);

insert into public.learning_topics (skill_id, topic, difficulty, estimated_minutes, phase)
select q.skill_id,
       q.topic,
       coalesce(q.difficulty, 'Intermediate'),
       case coalesce(q.difficulty, 'Intermediate') when 'Beginner' then 25 when 'Advanced' then 50 else 35 end,
       case when coalesce(q.difficulty, 'Intermediate') = 'Beginner' then 'Fundamentals'
            when coalesce(q.difficulty, 'Intermediate') = 'Advanced' then 'Advanced Skills'
            else 'Core Skills' end
from public.questions q
where q.topic is not null
on conflict (skill_id, topic) do update set difficulty = excluded.difficulty, estimated_minutes = excluded.estimated_minutes, phase = excluded.phase;

create or replace function public.touch_learning_progress_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists learning_progress_updated_at on public.learning_progress;
create trigger learning_progress_updated_at
before update on public.learning_progress
for each row execute procedure public.touch_learning_progress_updated_at();

alter table public.learning_topics enable row level security;
alter table public.learning_progress enable row level security;

drop policy if exists learning_topics_authenticated_read on public.learning_topics;
create policy learning_topics_authenticated_read on public.learning_topics
for select using (auth.uid() is not null);

drop policy if exists learning_progress_own_read on public.learning_progress;
create policy learning_progress_own_read on public.learning_progress
for select using (user_id = auth.uid());
drop policy if exists learning_progress_own_insert on public.learning_progress;
create policy learning_progress_own_insert on public.learning_progress
for insert with check (user_id = auth.uid());
drop policy if exists learning_progress_own_update on public.learning_progress;
create policy learning_progress_own_update on public.learning_progress
for update using (user_id = auth.uid()) with check (user_id = auth.uid());