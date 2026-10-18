-- Marketplace verification flow: the buyer sends a verification request, the seller
-- opens it and only then gets a random live challenge (a code word to write
-- down, a household object to place next to the item, and a camera angle).
-- The seller has 10 minutes to take one camera photo. analyze-scan checks the
-- photo against the challenge and the buyer gets a Proof Receipt that
-- expires 24 hours after the seller answers.
--
-- Additive only. Existing requests and functions keep working.

alter table public.proof_requests
  add column if not exists respondent_id uuid,
  add column if not exists responded_at timestamptz,
  add column if not exists updated_at timestamptz default now(),
  add column if not exists challenge jsonb,
  add column if not exists challenge_opened_at timestamptz,
  add column if not exists challenge_deadline timestamptz,
  add column if not exists challenge_checks jsonb,
  add column if not exists receipt_expires_at timestamptz;

alter table public.scans
  add column if not exists proof_request_id uuid
  references public.proof_requests(id) on delete set null;

-- The response, challenge and receipt columns are written only by the
-- security-definer functions (which run as the table owner) and by
-- analyze-scan (service role). The existing update policy lets a requester
-- update their own row, so without this a requester could mark their own
-- request answered with someone else's scan id and read that scan's result
-- through get_proof_request_result / get_proof_receipt. The insert policy
-- would allow the same thing on a new row. App users may only insert a
-- blank pending request (the app uses generate_proof_request instead) and
-- may only cancel a pending one.
create or replace function public.guard_proof_challenge_columns()
returns trigger
language plpgsql
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.status is distinct from 'pending'
      or new.response_scan_id is not null
      or new.respondent_id is not null
      or new.responded_at is not null
      or new.challenge is not null
      or new.challenge_opened_at is not null
      or new.challenge_deadline is not null
      or new.challenge_checks is not null
      or new.receipt_expires_at is not null
    then
      raise exception 'new proof requests must be blank and pending';
    end if;
    return new;
  end if;

  if new.challenge is distinct from old.challenge
    or new.challenge_opened_at is distinct from old.challenge_opened_at
    or new.challenge_deadline is distinct from old.challenge_deadline
    or new.challenge_checks is distinct from old.challenge_checks
    or new.receipt_expires_at is distinct from old.receipt_expires_at
    or new.response_scan_id is distinct from old.response_scan_id
    or new.respondent_id is distinct from old.respondent_id
    or new.responded_at is distinct from old.responded_at
    or new.requester_id is distinct from old.requester_id
    or new.share_code is distinct from old.share_code
  then
    raise exception 'proof request response fields are read-only';
  end if;

  if new.status is distinct from old.status
    and not (old.status = 'pending' and new.status = 'cancelled')
  then
    raise exception 'proof requests can only be cancelled';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_proof_challenge_columns on public.proof_requests;
create trigger guard_proof_challenge_columns
  before insert or update on public.proof_requests
  for each row execute function public.guard_proof_challenge_columns();

-- Called by the seller after they tap "Start challenge". The first call
-- claims the request for that user and starts the 10-minute clock; later
-- calls by the same user return the same challenge.
create or replace function public.open_proof_challenge(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_request public.proof_requests%rowtype;
  v_words text[] := array[
    'MAPLE', 'RIVER', 'TIGER', 'CANDLE', 'ORBIT', 'PEPPER', 'HARBOR', 'COMET',
    'BISON', 'LEMON', 'GRANITE', 'FALCON', 'VELVET', 'CACTUS', 'ANCHOR', 'MANGO'
  ];
  v_objects text[] := array[
    'a spoon', 'a fork', 'your keys', 'a coffee mug', 'a shoe', 'a TV remote',
    'a pen', 'a sock', 'a water bottle', 'a toothbrush', 'a coin', 'a cup'
  ];
  v_angles text[] := array[
    'from the left side', 'from the right side', 'from directly above',
    'from the back', 'up close so the item fills most of the photo'
  ];
  v_challenge jsonb;
begin
  if auth.uid() is null then
    return jsonb_build_object('error', 'not_authenticated');
  end if;

  select * into v_request
  from public.proof_requests
  where share_code = upper(trim(p_code))
  for update;

  if not found then
    return jsonb_build_object('error', 'not_found');
  end if;
  if v_request.requester_id = auth.uid() then
    return jsonb_build_object('error', 'own_request');
  end if;
  if v_request.status <> 'pending' then
    return jsonb_build_object('error', 'not_open');
  end if;
  if v_request.expires_at < now() then
    return jsonb_build_object('error', 'expired');
  end if;

  if v_request.challenge is null then
    v_challenge := jsonb_build_object(
      'phrase', v_words[1 + floor(random() * array_length(v_words, 1))::int]
                || '-' || (10 + floor(random() * 90)::int)::text,
      'object', v_objects[1 + floor(random() * array_length(v_objects, 1))::int],
      'angle', v_angles[1 + floor(random() * array_length(v_angles, 1))::int]
    );

    update public.proof_requests
    set challenge = v_challenge,
        challenge_opened_at = now(),
        challenge_deadline = now() + interval '10 minutes',
        respondent_id = auth.uid(),
        updated_at = now()
    where id = v_request.id
    returning * into v_request;
  elsif v_request.respondent_id is distinct from auth.uid() then
    return jsonb_build_object('error', 'already_claimed');
  end if;

  if v_request.challenge_deadline < now() then
    return jsonb_build_object('error', 'challenge_expired');
  end if;

  return jsonb_build_object(
    'request_id', v_request.id,
    'item', v_request.title,
    'note', v_request.message,
    'phrase', v_request.challenge ->> 'phrase',
    'object', v_request.challenge ->> 'object',
    'angle', v_request.challenge ->> 'angle',
    'deadline', v_request.challenge_deadline
  );
end;
$$;

revoke all on function public.open_proof_challenge(text) from public, anon;
grant execute on function public.open_proof_challenge(text) to authenticated;

-- Called by the seller's app after analyze-scan has checked the photo.
-- The photo must have been uploaded before the deadline.
create or replace function public.submit_challenge_response(p_request_id uuid, p_scan_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_request public.proof_requests%rowtype;
  v_scan public.scans%rowtype;
begin
  if auth.uid() is null then
    return jsonb_build_object('error', 'not_authenticated');
  end if;

  select * into v_request
  from public.proof_requests
  where id = p_request_id and respondent_id = auth.uid()
  for update;

  if not found then
    return jsonb_build_object('error', 'not_found');
  end if;
  if v_request.status <> 'pending' then
    return jsonb_build_object('error', 'not_open');
  end if;

  select * into v_scan
  from public.scans
  where id = p_scan_id and user_id = auth.uid() and proof_request_id = p_request_id;

  if not found then
    return jsonb_build_object('error', 'invalid_scan');
  end if;
  if v_scan.created_at > v_request.challenge_deadline then
    return jsonb_build_object('error', 'too_late');
  end if;
  -- analyze-scan stores the checks with the scan they came from. Only that
  -- scan (the most recently analyzed one) can be sent, so the receipt's
  -- checks and risk score always describe the same photo.
  if not exists (select 1 from public.scan_assessments where scan_id = p_scan_id)
     or (v_request.challenge_checks ->> 'scan_id') is distinct from p_scan_id::text then
    return jsonb_build_object('error', 'not_analyzed');
  end if;

  update public.proof_requests
  set status = 'responded',
      response_scan_id = p_scan_id,
      responded_at = now(),
      receipt_expires_at = now() + interval '24 hours',
      updated_at = now()
  where id = p_request_id;

  return jsonb_build_object('success', true);
end;
$$;

revoke all on function public.submit_challenge_response(uuid, uuid) from public, anon;
grant execute on function public.submit_challenge_response(uuid, uuid) to authenticated;

-- The buyer's Proof Receipt. Only the buyer who sent the request can read it,
-- and only the result: never the seller's photo. After 24 hours it returns
-- only that it expired.
create or replace function public.get_proof_receipt(p_request_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_request public.proof_requests%rowtype;
  v_assessment public.scan_assessments%rowtype;
  v_checks jsonb;
  v_possession text;
begin
  if auth.uid() is null then
    return jsonb_build_object('error', 'not_authenticated');
  end if;

  select * into v_request
  from public.proof_requests
  where id = p_request_id and requester_id = auth.uid();

  if not found then
    return jsonb_build_object('error', 'not_found');
  end if;
  if v_request.response_scan_id is null
     or v_request.status not in ('responded', 'completed') then
    return jsonb_build_object('error', 'not_ready');
  end if;
  if v_request.receipt_expires_at is not null and v_request.receipt_expires_at < now() then
    return jsonb_build_object(
      'expired', true,
      'item', v_request.title,
      'receipt_expires_at', v_request.receipt_expires_at
    );
  end if;

  select * into v_assessment
  from public.scan_assessments
  where scan_id = v_request.response_scan_id
  order by created_at desc
  limit 1;

  if not found then
    return jsonb_build_object('error', 'not_ready');
  end if;

  v_checks := coalesce(v_request.challenge_checks, '{}'::jsonb);
  if (v_checks ->> 'scan_id') is distinct from v_request.response_scan_id::text then
    v_checks := '{}'::jsonb;
  end if;
  v_possession := case
    when (v_checks ->> 'item_visible')::boolean
     and (v_checks ->> 'phrase_matches')::boolean
     and (v_checks ->> 'object_visible')::boolean
     and coalesce((v_checks ->> 'looks_live')::boolean, false) then 'strong'
    when (v_checks ->> 'item_visible')::boolean
     and ((v_checks ->> 'phrase_matches')::boolean or (v_checks ->> 'object_visible')::boolean) then 'partial'
    else 'weak'
  end;

  return jsonb_build_object(
    'expired', false,
    'item', v_request.title,
    'challenge', v_request.challenge,
    'checks', v_checks,
    'possession', v_possession,
    'challenge_completed', v_request.challenge is not null,
    'risk_level', v_assessment.risk_level,
    'risk_score', v_assessment.risk_score,
    'summary', v_assessment.summary,
    'warning_signals', coalesce(to_jsonb(v_assessment.warning_signals), '[]'::jsonb),
    'recommended_actions', coalesce(to_jsonb(v_assessment.recommended_actions), '[]'::jsonb),
    'responded_at', v_request.responded_at,
    'receipt_expires_at', v_request.receipt_expires_at
  );
end;
$$;

revoke all on function public.get_proof_receipt(uuid) from public, anon;
grant execute on function public.get_proof_receipt(uuid) to authenticated;
