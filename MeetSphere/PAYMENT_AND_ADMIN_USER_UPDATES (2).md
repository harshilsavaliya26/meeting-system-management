# MeetSphere – Admin & User Payment Updates

## Added
1. Meeting hosting payment is now recorded in `meeting_payments` when a paid meeting is created.
2. The same payment record appears in:
   - User -> Payment History
   - Admin -> Payments & Revenue
   - Admin -> Revenue total
3. User Dashboard now shows `Total payments`.
4. `CreateMeetingRequest` now includes the `Price` field used by the frontend.
5. Existing attendee payment flow remains connected to the same `meeting_payments` table.
6. Paid meeting access continues to use the `meeting_payments.payment_status='Paid'` check.

## Database
The existing `database/meetsphere.sql` already contains the `meeting_payments` table. No separate payment table is required.

## Important
This update keeps the existing Razorpay/demo payment flow. A gateway-confirmed attendee payment is marked `Paid` only after the existing verification flow succeeds. The host's ₹100 meeting-creation fee is recorded by the existing host-creation flow so it is visible in both panels.

## Run
Backend:
```powershell
cd MeetSphere\backend\MeetSphere.Api
dotnet restore
dotnet run
```

Frontend:
```powershell
cd MeetSphere\frontend
npm install
ng serve
```

Open:
`http://localhost:4200`

Database:
Import `database/meetsphere.sql` into MySQL and make sure the connection string in `backend/MeetSphere.Api/appsettings.json` matches your MySQL password.
