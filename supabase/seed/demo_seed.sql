-- SkillTrack demo seed data. Fictional catalog content only; run after 001_skilltrack_schema.sql.
insert into public.skills (name, category, description, target_score) values
 ('HTML', 'Frontend', 'Semantic structure and accessible markup', 80),
 ('CSS', 'Frontend', 'Layout, responsive design, and visual systems', 80),
 ('JavaScript', 'Frontend', 'Modern browser programming and async logic', 80),
 ('React', 'Frontend', 'Component architecture and state management', 80),
 ('Java', 'Backend', 'Object-oriented application development', 75),
 ('SQL', 'Data', 'Relational data modeling and querying', 75),
 ('Communication', 'Professional', 'Clear written and spoken collaboration', 75)
on conflict (name) do nothing;

insert into public.assessments (skill_id, title, description, duration_minutes, question_count)
select id, name || ' Skills Check', 'A focused diagnostic for your current ' || name || ' capability.', 12, 10
from public.skills s where not exists (select 1 from public.assessments a where a.skill_id = s.id);

-- Ten question records per major skill, generated from topic-specific demo prompts.
do $$
declare skill_row record; topic_name text; topic_list text[]; i integer;
begin
  for skill_row in select id, name from public.skills loop
    if skill_row.name = 'HTML' then topic_list := array['Semantics','Forms','Accessibility','Metadata','Tables','Media','Structure','ARIA','Validation','Performance'];
    elsif skill_row.name = 'CSS' then topic_list := array['Selectors','Box model','Flexbox','Grid','Responsive design','Specificity','Positioning','Typography','Animations','Accessibility'];
    elsif skill_row.name = 'JavaScript' then topic_list := array['Variables','Functions','Arrays','Async JavaScript','Promises','DOM','ES6','Objects','Events','Modules'];
    elsif skill_row.name = 'React' then topic_list := array['Components','Props','State','Hooks','Effects','Forms','Keys','Context','Performance','Accessibility'];
    elsif skill_row.name = 'Java' then topic_list := array['Classes','Inheritance','Interfaces','Collections','Exceptions','Generics','Streams','Threads','Encapsulation','Testing'];
    elsif skill_row.name = 'SQL' then topic_list := array['Select','Filtering','Joins','Grouping','Indexes','Constraints','Transactions','Subqueries','Normalization','Security'];
    else topic_list := array['Listening','Writing','Presentation','Feedback','Collaboration','Clarity','Planning','Conflict','Stakeholders','Inclusive communication'];
    end if;
    for i in 1..10 loop
      topic_name := topic_list[i];
      insert into public.questions (skill_id, question_text, option_a, option_b, option_c, option_d, correct_option, topic, difficulty)
      select skill_row.id, 'Which statement best describes the ' || topic_name || ' concept in ' || skill_row.name || '?',
        case skill_row.name when 'JavaScript' then 'A JavaScript language feature used in application code' when 'SQL' then 'A relational database concept used in SQL' when 'React' then 'A React concept used to build component-based interfaces' when 'Java' then 'A Java language concept used in application development' when 'HTML' then 'An HTML concept used to structure a web document' when 'CSS' then 'A CSS concept used to build a maintainable interface' else 'A professional communication practice used in collaborative work' end,
        case skill_row.name when 'JavaScript' then 'A CSS layout rule used only for visual styling' when 'SQL' then 'A JavaScript function that updates browser styles' when 'React' then 'A SQL clause that filters database rows' when 'Java' then 'A CSS property that changes page layout' when 'HTML' then 'A JavaScript promise that resolves a request' when 'CSS' then 'A JavaScript array method' else 'A database command that changes a table schema' end,
        case skill_row.name when 'JavaScript' then 'A SQL command that changes database records' when 'SQL' then 'A React component property' when 'React' then 'A Java class declaration' when 'Java' then 'A SQL statement that deletes a table' when 'HTML' then 'A SQL index used for queries' when 'CSS' then 'A SQL transaction' else 'A browser event listener' end,
        case skill_row.name when 'JavaScript' then 'A Java class member' when 'SQL' then 'A Java class used to start a server' when 'React' then 'A Java inheritance rule' when 'Java' then 'A React hook for navigation' when 'HTML' then 'A Java annotation' when 'CSS' then 'A Java interface' else 'A Java compiler setting' end,
        0, topic_name, case when i <= 3 then 'Beginner' when i <= 7 then 'Intermediate' else 'Advanced' end
      where not exists (select 1 from public.questions q where q.skill_id = skill_row.id and q.topic = topic_name);
    end loop;
  end loop;
end $$;

insert into public.learning_resources (skill_id, title, description, level, estimated_minutes, resource_url)
select s.id, r.title, r.description, r.level, r.minutes, r.url
from public.skills s cross join (values
 ('Foundations module', 'Build a reliable foundation with guided practice.', 'Beginner', 45, 'https://developer.mozilla.org/'),
 ('Applied practice lab', 'Apply the skill to a realistic product scenario.', 'Intermediate', 60, 'https://www.freecodecamp.org/'),
 ('Advanced challenge', 'Stretch your reasoning with an assessment-style challenge.', 'Advanced', 90, 'https://web.dev/')
) r(title, description, level, minutes, url)
where not exists (select 1 from public.learning_resources lr where lr.skill_id = s.id and lr.title = r.title);

-- Eight fictional jobs are inserted only when an employer account exists. Create an employer account first.
do $$ declare employer_id uuid; job_id uuid; skill_id bigint; begin
 select p.id into employer_id from public.profiles p where p.role = 'employer' limit 1;
 if employer_id is not null then
   for job_id in select gen_random_uuid() from generate_series(1, 8) loop
     insert into public.jobs (id, employer_id, title, company_name, location, description, experience_required, employment_type, salary_range, status)
     values (job_id, employer_id, (array['Frontend Developer','Junior React Engineer','Data Analyst','Java Developer','QA Automation Engineer','Product Support Associate','Full Stack Developer','UI Accessibility Specialist'])[floor(random()*8+1)], 'Northstar Demo ' || substring(job_id::text, 1, 4), 'Remote / Hybrid', 'A fictional demo role for SkillTrack matching.', '0-3 years', 'Full-time', 'Demo range', 'Active');
     select id into skill_id from public.skills where name = 'JavaScript' limit 1; insert into public.job_skills(job_id, skill_id, minimum_score) values(job_id, skill_id, 70) on conflict do nothing;
     select id into skill_id from public.skills where name = 'React' limit 1; insert into public.job_skills(job_id, skill_id, minimum_score) values(job_id, skill_id, 65) on conflict do nothing;
   end loop;
 end if;
end $$;
