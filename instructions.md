# Supabase Auth Setup

Use this checklist in the Supabase dashboard for the Dead Empire site.

## Authentication

1. Open the Supabase project dashboard.
2. Go to `Authentication` > `Providers`.
3. Enable `Email`.
4. Disable public signups:
   - Go to `Authentication` > `Providers` > `Email`.
   - Turn off user signups if the dashboard exposes that toggle for your project.
   - Keep email/password login enabled.
5. Go to `Authentication` > `URL Configuration`.
6. Set `Site URL` to the GitHub Pages URL:
   - `https://thesedatz.github.io/deadempire/`
7. Add redirect URLs:
   - `https://thesedatz.github.io/deadempire/**`
   - `http://localhost:5173/**`

## Creating Player Accounts

Create accounts manually instead of allowing public signup.

1. Go to `Authentication` > `Users`.
2. Click `Add user` or `Invite user`.
3. Use the player's generated campaign email address.
   - Example: username `jace` becomes `jace@dead-empire.local`
4. Set or generate a temporary password.
5. Give that username/password to the player privately.
6. Ask the player to sign in at `/profile`.

The profile page now offers a password-change form after sign-in when the user's metadata does not include `password_changed_at`. After the player changes their password, the app stores that timestamp in Supabase Auth user metadata and stops showing the first-login prompt.

## Roll Logging And Privacy

The app redirects unauthenticated `/roll-log` visitors to `/profile`, and dice rolls are only logged when a Supabase user is signed in.

The local `supabase/dice_rolls.sql` file is intentionally ignored by Git because it may contain setup details. Run that file locally in the Supabase SQL editor after changing the table shape.

For authenticated roll-log reads, use:

```sql
revoke select on table public.dice_rolls from anon;

grant select (
  id,
  created_at,
  roller_username,
  source_code,
  dice_count,
  modifier,
  subtotal,
  total,
  wild_total,
  wild_status_code
) on table public.dice_rolls to authenticated;

drop policy if exists "Allow public dice roll reads" on public.dice_rolls;
drop policy if exists "Allow authenticated dice roll reads" on public.dice_rolls;
create policy "Allow authenticated dice roll reads"
on public.dice_rolls
for select
to authenticated
using (true);
```

Roll inserts should be authenticated-only:

```sql
revoke insert on table public.dice_rolls from anon;
grant insert on table public.dice_rolls to authenticated;

drop policy if exists "Allow public dice roll inserts" on public.dice_rolls;
drop policy if exists "Allow authenticated dice roll inserts" on public.dice_rolls;
create policy "Allow authenticated dice roll inserts"
on public.dice_rolls
for insert
to authenticated
with check (
  roller_id = auth.uid()
  and roller_username = left(
    regexp_replace(
      lower(regexp_replace(auth.jwt() ->> 'email', '@dead-empire\.local$', '')),
      '[^a-z0-9_-]',
      '_',
      'g'
    ),
    32
  )
);
```

## Character Sheet Storage

Character sheets are stored in Supabase in `public.character_sheets` with the full sheet body in a `jsonb` column named `sheet`.

Setup:

1. Run `supabase/character_sheets.sql` in the Supabase SQL editor.
2. Sign in as an admin user.
3. Open `/admin`.
4. Import existing character JSON files.

Backup:

1. Open `/admin`.
2. Click `Download Backup`.
3. Keep the downloaded JSON somewhere safe before large edits.

The import accepts a single character JSON object, an array of character JSON objects, or a backup object with a `character_sheets` array. Public site visitors can read active character sheets. Only users with admin app metadata can insert, update, or delete rows.

## Username-Only Login

Supabase Auth is email-oriented by default. A true username-only login is possible, but it needs an extra mapping layer because `signInWithPassword` expects an email/password credential.

### Easy Option: Fake Campaign Emails

Use generated email-shaped usernames that are not real inboxes.

Example:

- `jace@dead-empire.local`
- `vexa@dead-empire.local`
- `tarn@dead-empire.local`

Then tell players their username is the part before `@dead-empire.local`. The app can append `@dead-empire.local` before calling Supabase login.

Dashboard setup:

1. Go to `Authentication` > `Users`.
2. Create users with generated email-style usernames.
3. Use temporary passwords.
4. Disable email confirmation, because these are not real inboxes.
5. Keep public signup disabled.

App behavior:

1. `/profile` shows a username field.
2. The app converts the username to an email internally:
   - `username.trim().toLowerCase() + '@dead-empire.local'`
3. The app calls Supabase sign-in with that generated email and the password.

This is now the active login approach for the site.

### Stronger Option: Username Mapping Table

Create a `profiles` or `login_names` table that maps usernames to real Supabase user IDs or emails.

Important: do not make this a public readable table. If the browser can freely query `username -> email`, then usernames become easy to enumerate.

This usually needs one of:

- a Supabase Edge Function that receives username/password, looks up the mapped email server-side, then signs in
- a custom RPC/function with careful permissions
- sticking with real emails for Auth and using usernames only as display names

Difficulty: medium to high. Use this only if fake campaign emails are not acceptable.

Recommended path for this site: use fake campaign emails first, then add display names in a `profiles` table later if needed.

## Admin Accounts

The `/admin` route is visible only to authenticated users whose Supabase Auth user has admin app metadata.

Use `app_metadata`, not `user_metadata`. App metadata is controlled by admins, while user metadata can be user-editable.

Dashboard setup:

1. Go to `Authentication` > `Users`.
2. Select your GM/admin user.
3. Open the user's metadata editor.
4. Set app metadata to:

```json
{
  "role": "admin"
}
```

5. Save the user.
6. Sign out and sign back in at `/profile` so the browser gets a fresh auth token with the new metadata.

Expected behavior:

- Not signed in and visiting `/admin`: redirected to `/profile`.
- Signed in without admin metadata: redirected to `/403`.
- Signed in with `"role": "admin"` in app metadata: allowed into `/admin`.

This protects the route in the app. If future admin pages read or write Supabase data, also enforce admin access in RLS policies or Edge Functions.
