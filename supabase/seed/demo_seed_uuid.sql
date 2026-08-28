-- SkillTrack demo seed data for supabase/schema.sql.
-- Fictional learning content and jobs only. Run manually after schema.sql.

insert into public.skills (name, category, description, target_score) values
('HTML','Frontend','Semantic structure and accessible markup',80),
('CSS','Frontend','Responsive layout and visual systems',80),
('JavaScript','Frontend','Modern browser programming and asynchronous logic',80),
('React','Frontend','Component architecture and state management',80),
('Java','Backend','Object-oriented application development',75),
('SQL','Data','Relational querying and data modeling',75),
('Communication','Professional','Clear written and spoken collaboration',75)
on conflict (name) do nothing;

insert into public.assessments (skill_id,title,description,duration_minutes,question_count)
select id, name || ' Skills Check', 'A focused diagnostic for your current ' || name || ' capability.', 12, 10
from public.skills where category in ('Frontend','Backend','Data')
  and not exists (select 1 from public.assessments a where a.skill_id = public.skills.id);

-- Ten realistic topic records per technical skill. Answer A is intentionally correct in this demo catalog.
do $$
declare s record; topics text[]; topic text; n integer;
begin
  for s in select id, name from public.skills where category in ('Frontend','Backend','Data') loop
    topics := case s.name
      when 'HTML' then array['Semantics','Forms','Accessibility','Metadata','Tables','Media','Structure','ARIA','Validation','Performance']
      when 'CSS' then array['Selectors','Box model','Flexbox','Grid','Responsive design','Specificity','Positioning','Typography','Animations','Accessibility']
      when 'JavaScript' then array['Variables','Functions','Arrays','Async JavaScript','Promises','DOM','ES6','Objects','Events','Modules']
      when 'React' then array['Components','Props','State','Hooks','Effects','Forms','Keys','Context','Performance','Accessibility']
      when 'Java' then array['Classes','Inheritance','Interfaces','Collections','Exceptions','Generics','Streams','Threads','Encapsulation','Testing']
      else array['Select','Filtering','Joins','Grouping','Indexes','Constraints','Transactions','Subqueries','Normalization','Security']
    end;
    for n in 1..10 loop
      topic := topics[n];
      insert into public.questions (skill_id,question_text,option_a,option_b,option_c,option_d,correct_option,topic,difficulty)
      values (s.id, 'Which statement best describes ' || topic || ' in ' || s.name || '?',
        case s.name when 'JavaScript' then 'A JavaScript language feature used in application code' when 'SQL' then 'A relational database concept used in SQL' when 'React' then 'A React concept used to build component-based interfaces' when 'Java' then 'A Java language concept used in application development' when 'HTML' then 'An HTML concept used to structure a web document' when 'CSS' then 'A CSS concept used to build a maintainable interface' else 'A professional communication practice used in collaborative work' end,
        case s.name when 'JavaScript' then 'A CSS layout rule used only for visual styling' when 'SQL' then 'A JavaScript function that updates browser styles' when 'React' then 'A SQL clause that filters database rows' when 'Java' then 'A CSS property that changes page layout' when 'HTML' then 'A JavaScript promise that resolves a request' when 'CSS' then 'A JavaScript array method' else 'A database command that changes a table schema' end,
        case s.name when 'JavaScript' then 'A SQL command that changes database records' when 'SQL' then 'A React component property' when 'React' then 'A Java class declaration' when 'Java' then 'A SQL statement that deletes a table' when 'HTML' then 'A SQL index used for queries' when 'CSS' then 'A SQL transaction' else 'A browser event listener' end,
        case s.name when 'JavaScript' then 'A Java class member' when 'SQL' then 'A Java class used to start a server' when 'React' then 'A Java inheritance rule' when 'Java' then 'A React hook for navigation' when 'HTML' then 'A Java annotation' when 'CSS' then 'A Java interface' else 'A Java compiler setting' end,
        'A', topic, case when n <= 3 then 'Beginner' when n <= 7 then 'Intermediate' else 'Advanced' end)
      on conflict do nothing;
    end loop;
  end loop;
end $$;

insert into public.learning_resources (skill_id,title,description,level,estimated_minutes,resource_url)
select s.id, r.title, r.description, r.level, r.minutes, r.url
from public.skills s cross join (values
 ('Foundations module','Build a reliable foundation with guided practice.','Beginner',45,'https://developer.mozilla.org/'),
 ('Applied practice lab','Apply the skill to a realistic product scenario.','Intermediate',60,'https://www.freecodecamp.org/'),
 ('Advanced challenge','Stretch your reasoning with an assessment-style challenge.','Advanced',90,'https://web.dev/')
) r(title,description,level,minutes,url)
where not exists (select 1 from public.learning_resources lr where lr.skill_id=s.id and lr.title=r.title);

-- Five fictional jobs. They are inserted when at least one employer profile exists.
do $$
declare employer_id uuid;
begin
  select u.id into employer_id from auth.users u join public.profiles p on p.id = u.id where p.role = 'employer' limit 1;
  if employer_id is not null then
    insert into public.jobs (employer_id,title,company_name,location,description,experience_required,employment_type,salary_range,status) values
      (employer_id,'Frontend Developer','Northstar Demo Labs','Remote','Fictional demo role for skills matching.','1-3 years','Full-time','Demo range','Active'),
      (employer_id,'React Engineer','BrightField Studio','Hybrid','Fictional demo role for skills matching.','2-4 years','Full-time','Demo range','Active'),
      (employer_id,'Java Developer','Cedarline Systems','Remote','Fictional demo role for skills matching.','1-3 years','Full-time','Demo range','Active'),
      (employer_id,'Data Analyst','Atlas Grove','On-site','Fictional demo role for skills matching.','0-2 years','Full-time','Demo range','Active'),
      (employer_id,'Accessibility Specialist','Civic Pixel Demo','Hybrid','Fictional demo role for skills matching.','1-3 years','Contract','Demo range','Active');
  end if;
end $$;
