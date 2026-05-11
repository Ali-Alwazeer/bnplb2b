
-- Allow owner to update their draft, and to transition status from draft -> legal_review/credit_review on submit
DROP POLICY IF EXISTS "Owners update own draft application" ON public.applications;

CREATE POLICY "Owners update own draft application"
ON public.applications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status = 'draft')
WITH CHECK (
  auth.uid() = user_id
  AND status IN ('draft','legal_review','credit_review')
);

-- Update trigger to permit the submit transition while still blocking other staff fields
CREATE OR REPLACE FUNCTION public.prevent_owner_staff_field_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  if auth.uid() = old.user_id
     and not (public.has_role(auth.uid(),'admin')
              or public.has_role(auth.uid(),'credit')
              or public.has_role(auth.uid(),'legal')) then

    -- Allow only the submit transition: draft -> legal_review or credit_review
    if new.status is distinct from old.status then
      if not (old.status = 'draft' and new.status in ('legal_review','credit_review')) then
        raise exception 'Owners can only submit a draft application';
      end if;
    end if;

    if new.assigned_limit is distinct from old.assigned_limit
       or new.guarantee_approved is distinct from old.guarantee_approved
       or new.review_notes is distinct from old.review_notes
       or new.contract_signed is distinct from old.contract_signed
       or new.user_id is distinct from old.user_id then
      raise exception 'Owners cannot modify staff-managed fields on applications';
    end if;
  end if;
  return new;
end;
$function$;

-- Ensure the trigger exists on applications
DROP TRIGGER IF EXISTS trg_prevent_owner_staff_field_changes ON public.applications;
CREATE TRIGGER trg_prevent_owner_staff_field_changes
BEFORE UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.prevent_owner_staff_field_changes();
