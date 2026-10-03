-- submit_proof_response(p_code, p_scan_id) set status = 'responded' but never
-- stored p_scan_id, so get_proof_request_result() could never find the verdict.
-- This patches the live function in place: it adds a check that the scan
-- belongs to the responding user and stores response_scan_id. Everything else
-- in the existing definition is kept as-is.
--
-- The live proof_requests table had no response_scan_id column at all
-- (checked 2026-10-03), so it is added first. Additive only.
alter table public.proof_requests
  add column if not exists response_scan_id uuid
  references public.scans(id) on delete set null;

do $$
declare
  v_def text;
  v_new text;
begin
  select pg_get_functiondef(p.oid) into v_def
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'submit_proof_response';

  if v_def is null then
    raise exception 'submit_proof_response not found';
  end if;

  if position('response_scan_id' in v_def) > 0 then
    raise notice 'submit_proof_response already stores response_scan_id; nothing to do';
    return;
  end if;

  v_new := replace(
    v_def,
    'UPDATE public.proof_requests',
    E'IF NOT EXISTS (SELECT 1 FROM public.scans WHERE id = p_scan_id AND user_id = auth.uid()) THEN\n'
    || E'    RETURN json_build_object(''success'', false, ''error'', ''invalid_scan'');\n'
    || E'  END IF;\n\n  UPDATE public.proof_requests'
  );
  v_new := replace(
    v_new,
    'status = ''responded'',',
    'status = ''responded'', response_scan_id = p_scan_id,'
  );

  if v_new = v_def or position('response_scan_id = p_scan_id' in v_new) = 0 then
    raise exception 'submit_proof_response did not match the expected shape; not changed';
  end if;

  execute v_new;
end;
$$;
