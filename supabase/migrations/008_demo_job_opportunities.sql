-- Add realistic demo opportunities for an existing employer without duplicating jobs.
do $$
declare
  v_employer_id uuid;
  v_job_id uuid;
  job_record record;
  v_skill_name text;
  v_skill_score integer;
  v_skill_id bigint;
begin
  select p.id into v_employer_id from public.profiles p where p.role = 'employer' limit 1;
  if v_employer_id is null then return; end if;

  for job_record in select * from (values
    ('Frontend Developer', 'Northstar Digital', 'Remote', 'Full-time', 'Build accessible, responsive product interfaces for a growing digital platform.', 'Build reusable UI components, partner with design, and improve frontend performance.', 'JavaScript', 70),
    ('React Developer', 'BrightField Studio', 'Hybrid', 'Full-time', 'Create maintainable React experiences for customer-facing web products.', 'Own component architecture, collaborate on API integration, and review frontend code.', 'React', 65),
    ('Junior Full Stack Developer', 'Cedarline Systems', 'Remote', 'Full-time', 'Support end-to-end product delivery across a modern web stack.', 'Develop user stories, connect APIs, write tests, and support production releases.', 'JavaScript', 60),
    ('Backend Developer', 'Atlas Grove', 'Hybrid', 'Full-time', 'Design reliable services and data workflows for operational products.', 'Implement APIs, model data, monitor services, and improve application reliability.', 'SQL', 65),
    ('Java Developer', 'Meridian Works', 'On-site', 'Full-time', 'Develop robust Java services for enterprise workflow automation.', 'Build domain services, write automated tests, and participate in technical design.', 'Java', 65),
    ('Data Analyst', 'Civic Pixel Labs', 'Remote', 'Contract', 'Turn operational data into clear insights for product and programme teams.', 'Write analytical queries, validate datasets, and communicate findings to stakeholders.', 'SQL', 60)
  ) as opportunities(title, company_name, location, employment_type, description, responsibilities, primary_skill, minimum_score)
  loop
    select j.id into v_job_id from public.jobs j where j.employer_id = v_employer_id and j.title = job_record.title limit 1;
    if v_job_id is null then
      insert into public.jobs (employer_id, title, company_name, location, description, responsibilities, employment_type, salary_range, status)
      values (v_employer_id, job_record.title, job_record.company_name, job_record.location, job_record.description, job_record.responsibilities, job_record.employment_type, 'Available on request', 'Active')
      returning id into v_job_id;
    else
      update public.jobs set responsibilities = coalesce(public.jobs.responsibilities, job_record.responsibilities) where public.jobs.id = v_job_id;
    end if;

    select s.id into v_skill_id from public.skills s where s.name = job_record.primary_skill limit 1;
    if v_skill_id is not null then
      insert into public.job_skills (job_id, skill_id, minimum_score)
      values (v_job_id, v_skill_id, job_record.minimum_score)
      on conflict (job_id, skill_id) do update set minimum_score = excluded.minimum_score;
    end if;

    for v_skill_name, v_skill_score in select secondary.skill_name, secondary.skill_score from (values
      ('HTML', 60), ('CSS', 60), ('React', 65), ('JavaScript', 70), ('SQL', 65), ('Java', 65)
    ) as secondary(skill_name, skill_score)
    loop
      if v_skill_name <> job_record.primary_skill and (
        (job_record.title = 'Frontend Developer' and v_skill_name in ('HTML', 'CSS', 'JavaScript')) or
        (job_record.title = 'React Developer' and v_skill_name in ('JavaScript', 'CSS')) or
        (job_record.title = 'Junior Full Stack Developer' and v_skill_name in ('React', 'SQL')) or
        (job_record.title = 'Backend Developer' and v_skill_name in ('Java', 'SQL')) or
        (job_record.title = 'Java Developer' and v_skill_name = 'SQL') or
        (job_record.title = 'Data Analyst' and v_skill_name = 'JavaScript')
      ) then
        select s.id into v_skill_id from public.skills s where s.name = v_skill_name limit 1;
        if v_skill_id is not null then
          insert into public.job_skills (job_id, skill_id, minimum_score)
          values (v_job_id, v_skill_id, v_skill_score)
          on conflict (job_id, skill_id) do update set minimum_score = excluded.minimum_score;
        end if;
      end if;
    end loop;
  end loop;
end;
$$;
