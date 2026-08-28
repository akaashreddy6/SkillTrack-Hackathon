-- Scores attempts inside Postgres so browser input cannot define the result.
create or replace function public.submit_assessment(
  p_assessment_id uuid,
  p_answers jsonb,
  p_started_at timestamptz
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  assessment_row public.assessments%rowtype;
  question_row record;
  attempt_row public.assessment_attempts%rowtype;
  answer_value text;
  selected_option text;
  normalized_correct_option text;
  target_score integer;
  correct_answers integer := 0;
  total_questions integer := 0;
  percentage integer;
  performance_level text;
  completed_at timestamptz := now();
begin
  if auth.uid() is null then raise exception 'You must be signed in to submit an assessment.'; end if;
  select * into assessment_row from public.assessments where id = p_assessment_id;
  if not found then raise exception 'Assessment not found.'; end if;

  if exists (
    select 1
    from public.assessment_attempts existing_attempt
    where existing_attempt.user_id = auth.uid()
      and existing_attempt.assessment_id = p_assessment_id
      and existing_attempt.started_at = p_started_at
  ) then
    raise exception 'This assessment attempt has already been submitted.';
  end if;

  for question_row in
    select question_record.id, question_record.correct_option
    from public.questions question_record
    where question_record.skill_id = assessment_row.skill_id
    order by question_record.id
  loop
    total_questions := total_questions + 1;
    answer_value := p_answers ->> question_row.id::text;
    selected_option := case upper(coalesce(answer_value, '')) when '0' then 'A' when '1' then 'B' when '2' then 'C' when '3' then 'D' else upper(answer_value) end;
    normalized_correct_option := case upper(question_row.correct_option::text) when '0' then 'A' when '1' then 'B' when '2' then 'C' when '3' then 'D' else upper(question_row.correct_option::text) end;
    if selected_option = normalized_correct_option then
      correct_answers := correct_answers + 1;
    end if;
  end loop;
  if total_questions = 0 then raise exception 'This assessment has no questions.'; end if;
  percentage := round(correct_answers::numeric / total_questions * 100);
  performance_level := case when percentage >= 80 then 'Excellent' when percentage >= 60 then 'Good' when percentage >= 40 then 'Needs Improvement' else 'Critical Gap' end;

  insert into public.assessment_attempts (user_id, assessment_id, score, total_questions, correct_answers, percentage, performance_level, started_at, completed_at)
  values (auth.uid(), p_assessment_id, percentage, total_questions, correct_answers, percentage, performance_level, p_started_at, completed_at)
  returning * into attempt_row;

  for question_row in
    select question_record.id, question_record.correct_option
    from public.questions question_record
    where question_record.skill_id = assessment_row.skill_id
    order by question_record.id
  loop
    answer_value := p_answers ->> question_row.id::text;
    selected_option := case upper(coalesce(answer_value, '')) when '0' then 'A' when '1' then 'B' when '2' then 'C' when '3' then 'D' else upper(answer_value) end;
    normalized_correct_option := case upper(question_row.correct_option::text) when '0' then 'A' when '1' then 'B' when '2' then 'C' when '3' then 'D' else upper(question_row.correct_option::text) end;
    insert into public.assessment_answers (attempt_id, question_id, selected_option, is_correct)
    values (attempt_row.id, question_row.id, answer_value, selected_option = normalized_correct_option);
  end loop;

  select s.target_score into target_score
  from public.skills s
  where s.id = assessment_row.skill_id;
  if not found then
    raise exception 'Skill for this assessment was not found.';
  end if;

  insert into public.skill_progress (user_id, skill_id, current_score, target_score, gap_percentage, last_assessed_at, updated_at)
  values (auth.uid(), assessment_row.skill_id, percentage, target_score, greatest(target_score - percentage, 0), completed_at, completed_at)
  on conflict (user_id, skill_id) do update
  set current_score = excluded.current_score,
      target_score = excluded.target_score,
      gap_percentage = excluded.gap_percentage,
      last_assessed_at = excluded.last_assessed_at,
      updated_at = excluded.updated_at;
  return to_jsonb(attempt_row);
end;
$$;

revoke all on function public.submit_assessment(uuid, jsonb, timestamptz) from public;
grant execute on function public.submit_assessment(uuid, jsonb, timestamptz) to authenticated;