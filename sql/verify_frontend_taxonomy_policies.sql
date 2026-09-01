-- Read-only audit: run in Supabase SQL Editor and inspect the result sets.
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('incidents', 'incident_classifications', 'incident_tags')
order by tablename, cmd, policyname;

select table_schema, table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('incidents', 'incident_classifications', 'incident_tags')
  and grantee in ('anon', 'authenticated')
order by table_name, grantee, privilege_type;

-- Expected:
-- * anon/authenticated have SELECT only.
-- * the three public-read policies have cmd = SELECT and permissive = PERMISSIVE.
-- * no INSERT, UPDATE, DELETE, or ALL policy grants anonymous writes.
