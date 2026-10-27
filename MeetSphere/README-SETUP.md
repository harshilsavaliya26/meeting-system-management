# MeetSphere Plus V16

## New in V16
- More permissive development CORS for `localhost` and `127.0.0.1` on local HTTP/HTTPS origins, to help prevent browser `HTTP 0 / Unknown Error` when the frontend origin differs.
- Added a safe database health endpoint at `http://localhost:5001/api/health/database`. It reports connection status without revealing credentials.
- Startup helper now checks both API and database health.
- Added `TEST-MEETSPHERE.ps1` for a no-code-change connection check.
- Retains shared User/Admin workspace records and admin edit/delete support for calendar, notes, contacts, automations and action items through the authenticated API.

## Run
1. Start XAMPP MySQL and make sure `meetsphere_db` exists.
2. Run `START-MEETSPHERE.ps1` from this extracted folder, or run backend and frontend separately:

Backend:
```powershell
cd .\backend\MeetSphere.Api
dotnet restore
dotnet run --urls http://localhost:5001
```

Frontend in another PowerShell:
```powershell
cd .\frontend
npm install
npm start
```

3. Open `http://localhost:4200`.
4. If Contacts fails, run `TEST-MEETSPHERE.ps1`. If database health is unavailable, inspect the backend console and MySQL configuration. API health endpoints do not require login; workspace endpoints still require a valid token and role.

## Shared data behavior
- User reads only their own records; admin can view/manage records across users through authenticated admin routes.
- Admin updates/deletes are persisted in MySQL. User pages refresh their shared records while open where polling is enabled.
- Browser-only checklists/drafts are not automatically synchronized to the admin panel.

## Verification
ZIP structure can be checked independently, but the complete Angular build, .NET compilation and live MySQL behavior must be verified on the target computer with the required SDKs, Node.js and database available.
