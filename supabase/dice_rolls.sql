create table if not exists public.dice_rolls (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  page text not null check (char_length(page) between 1 and 160),
  route_name text check (route_name is null or char_length(route_name) <= 80),
  source text not null check (source in ('manual', 'sheet')),
  dice_count integer not null check (dice_count between 1 and 30),
  modifier integer not null check (modifier between -99 and 99),
  subtotal integer not null check (subtotal between 1 and 500),
  total integer not null check (total between -98 and 599),
  wild_total integer not null check (wild_total between 1 and 500),
  wild_status text not null check (wild_status in ('normal', 'critical', 'exploded')),
  wild_breakdown jsonb not null default '[]'::jsonb check (jsonb_typeof(wild_breakdown) = 'array'),
  dice_breakdown jsonb not null default '[]'::jsonb check (jsonb_typeof(dice_breakdown) = 'array')
);

alter table public.dice_rolls enable row level security;

revoke all on table public.dice_rolls from anon, authenticated;
grant insert, select on table public.dice_rolls to anon, authenticated;

drop policy if exists "Allow public dice roll inserts" on public.dice_rolls;
drop policy if exists "Allow anonymous dice roll inserts" on public.dice_rolls;
create policy "Allow public dice roll inserts"
on public.dice_rolls
for insert
to anon, authenticated
with check (true);

drop policy if exists "Allow public dice roll reads" on public.dice_rolls;
create policy "Allow public dice roll reads"
on public.dice_rolls
for select
to anon, authenticated
using (true);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'dice_rolls'
  ) then
    alter publication supabase_realtime add table public.dice_rolls;
  end if;
end $$;
