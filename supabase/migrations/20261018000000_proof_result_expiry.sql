-- get_proof_request_result predates live challenges and ignored the Proof
-- Receipt's 24-hour expiry, so a buyer could still read an answered
-- request's result after the receipt expired. Requests answered through the
-- older flow have no receipt_expires_at and are unaffected.
create or replace function public.get_proof_request_result(p_request_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  v_request public.proof_requests%rowtype;
  v_assessment public.scan_assessments%rowtype;
begin
  if auth.uid() is null then
    return jsonb_build_object('error', 'not_authenticated');
  end if;

  select * into v_request
  from public.proof_requests
  where id = p_request_id
    and requester_id = auth.uid();

  if not found then
    return jsonb_build_object('error', 'not_found');
  end if;

  if v_request.response_scan_id is null
     or v_request.status not in ('responded', 'completed') then
    return jsonb_build_object('error', 'not_ready');
  end if;

  if v_request.receipt_expires_at is not null and v_request.receipt_expires_at < now() then
    return jsonb_build_object('error', 'expired');
  end if;

  select * into v_assessment
  from public.scan_assessments
  where scan_id = v_request.response_scan_id
  order by created_at desc
  limit 1;

  if not found then
    return jsonb_build_object('error', 'not_ready');
  end if;

  return jsonb_build_object(
    'risk_level', v_assessment.risk_level,
    'risk_score', v_assessment.risk_score,
    'summary', v_assessment.summary,
    'warning_signals', coalesce(to_jsonb(v_assessment.warning_signals), '[]'::jsonb),
    'recommended_actions', coalesce(to_jsonb(v_assessment.recommended_actions), '[]'::jsonb),
    'responded_at', to_jsonb(v_request) ->> 'responded_at',
    'completed_at', v_assessment.completed_at
  );
end;
$$;
