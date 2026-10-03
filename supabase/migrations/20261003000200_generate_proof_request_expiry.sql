-- The app lets the requester pick how long a Proof Request stays open
-- (1 hour to 7 days). The live generate_proof_request(p_title, p_message)
-- always uses 7 days. This adds an overload with p_expires_in_hours.
-- The two-argument version is redefined below to use the same code format.
create or replace function public.generate_proof_request(
  p_title text,
  p_message text,
  p_expires_in_hours integer
)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_code text;
  v_expires timestamptz;
  v_row public.proof_requests%rowtype;
  v_attempt integer := 0;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  v_expires := now() + make_interval(hours => least(greatest(coalesce(p_expires_in_hours, 168), 1), 168));

  loop
    v_attempt := v_attempt + 1;
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
    exit when not exists (select 1 from public.proof_requests where share_code = v_code);
    if v_attempt >= 5 then
      raise exception 'could not generate a unique share code';
    end if;
  end loop;

  insert into public.proof_requests (requester_id, share_code, title, message, expires_at, created_at)
  values (auth.uid(), v_code, p_title, p_message, v_expires, now())
  returning * into v_row;

  return json_build_object(
    'id', v_row.id,
    'share_code', v_row.share_code,
    'expires_at', v_row.expires_at,
    'created_at', v_row.created_at
  );
end;
$$;

revoke all on function public.generate_proof_request(text, text, integer) from public, anon;
grant execute on function public.generate_proof_request(text, text, integer) to authenticated;

-- The live two-argument version made 8-character base64 codes that could
-- contain '+', which the app's code entry rejects. proof_requests had no
-- rows when this was written (2026-10-03), so no existing codes change.
-- Route it through the overload above so every new code is 12 characters
-- of A-Z and 0-9, keeping its 7-day expiry.
create or replace function public.generate_proof_request(
  p_title text,
  p_message text
)
returns json
language sql
security definer
set search_path = public, pg_temp
as $$
  select public.generate_proof_request(p_title, p_message, 168);
$$;
