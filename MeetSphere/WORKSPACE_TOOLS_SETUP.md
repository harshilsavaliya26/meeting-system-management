# MeetSphere Workspace Tools

Added working user + admin modules:

- Calendar
- Notetaker
- Contacts
- Automations
- Upgrade plan / Subscriptions
- Existing Settings remains available

## User URLs
- `/calendar`
- `/notetaker`
- `/contacts`
- `/automations`
- `/upgrade`
- `/settings`

## Admin URLs
- `/admin-tools/calendar`
- `/admin-tools/notes`
- `/admin-tools/contacts`
- `/admin-tools/automations`
- `/admin-tools/upgrade`

All records are stored in MySQL tables created automatically by `WorkspaceController` and are also included in `database/meetsphere.sql`.

## How the admin side works
Admin accounts can see workspace records across users. User accounts only see and modify their own records. Upgrade/subscription records are visible in the Admin `Subscriptions / Plans` page.

## Run
1. Import `database/meetsphere.sql` into MySQL (safe to re-run for the new tables).
2. Start backend on `http://localhost:5001`.
3. Start frontend on `http://localhost:4200`.
4. Login as a user and use the new sidebar options.
5. Login as an admin and use the corresponding Admin Console options.
