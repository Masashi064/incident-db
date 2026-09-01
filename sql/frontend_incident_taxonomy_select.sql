-- Run manually in Supabase. This grants public read access only; no write policy is added.
grant select on table public.incident_classifications to anon, authenticated;
grant select on table public.incident_tags to anon, authenticated;
grant select on table public.incidents to anon, authenticated;

alter table public.incident_classifications enable row level security;
alter table public.incident_tags enable row level security;
alter table public.incidents enable row level security;

drop policy if exists "Public read incident boundaries" on public.incidents;
create policy "Public read incident boundaries"
on public.incidents for select
to anon, authenticated
using (true);

drop policy if exists "Public read non-rejected incident classifications" on public.incident_classifications;
create policy "Public read non-rejected incident classifications"
on public.incident_classifications for select
to anon, authenticated
using (
  taxonomy_version = '1.2'
  and review_status in ('draft', 'approved')
);

drop policy if exists "Public read non-rejected AI incident tags" on public.incident_tags;
create policy "Public read non-rejected AI incident tags"
on public.incident_tags for select
to anon, authenticated
using (
  taxonomy_version = '1.2'
  and review_status in ('draft', 'approved')
  and source = 'ai'
);
