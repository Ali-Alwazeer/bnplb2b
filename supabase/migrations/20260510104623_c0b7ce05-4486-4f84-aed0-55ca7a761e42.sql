
-- 1) Tighten owners' UPDATE policy on applications: only allow while status='draft' and prevent staff-field tampering via trigger.
drop policy if exists "Owners update own draft application" on public.applications;

create policy "Owners update own draft application"
  on public.applications for update to authenticated
  using (auth.uid() = user_id and status = 'draft')
  with check (auth.uid() = user_id and status = 'draft');

create or replace function public.prevent_owner_staff_field_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- If the actor is the owner and not staff, lock down staff-managed columns.
  if auth.uid() = old.user_id
     and not (public.has_role(auth.uid(),'admin')
              or public.has_role(auth.uid(),'credit')
              or public.has_role(auth.uid(),'legal')) then
    if new.status is distinct from old.status
       or new.assigned_limit is distinct from old.assigned_limit
       or new.guarantee_approved is distinct from old.guarantee_approved
       or new.review_notes is distinct from old.review_notes
       or new.contract_signed is distinct from old.contract_signed
       or new.user_id is distinct from old.user_id then
      raise exception 'Owners cannot modify staff-managed fields on applications';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists applications_block_owner_staff_fields on public.applications;
create trigger applications_block_owner_staff_fields
  before update on public.applications
  for each row execute function public.prevent_owner_staff_field_changes();

-- 2) Add UPDATE policy for kyc-documents storage so users can only replace their own files.
drop policy if exists "Users update own kyc files" on storage.objects;
create policy "Users update own kyc files"
  on storage.objects for update to authenticated
  using (bucket_id = 'kyc-documents' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'kyc-documents' and (storage.foldername(name))[1] = auth.uid()::text);
