# MeetSphere — Zoom-style meeting website starter

## Stack
- Frontend: Angular, Bootstrap, HTML, CSS, TypeScript
- Backend: ASP.NET Core Web API (.NET 8)
- Database: MySQL (manage it using XAMPP/phpMyAdmin)
- Includes separate User/Admin registration and login pages, role-based panels, meeting creation/listing, and admin user/meeting overview.

## 1. Database
1. Start **MySQL** in XAMPP.
2. Open `http://localhost/phpmyadmin`.
3. Import `database/meetsphere.sql`.
4. If your MySQL root account has a password, edit `backend/MeetSphere.Api/appsettings.json`.

## 2. Start backend
Install the .NET 8 SDK.
```powershell
cd backend/MeetSphere.Api
dotnet restore
dotnet run --urls http://localhost:5001
```
API: `http://localhost:5001/api/health`

## 3. Start frontend
Install Node.js LTS and Angular CLI if needed.
```powershell
cd frontend
npm install
npm start
```
Open **http://localhost:4200**. The home page has visible **User Login**, **Admin Login**, and **Get Started** options.
For local testing, create an admin in phpMyAdmin by setting a user's `role` to `admin` after registering, or register via the Admin Register page (the API restricts public admin registration unless `AllowAdminRegistration` is enabled in appsettings).

## Demo flow
1. Register as a user.
2. Login and open the User Dashboard.
3. Create a meeting; it will be saved to MySQL and receive a meeting code.
4. Admin login can view users and meetings.

## Important
This is a working foundation for authentication, role-separated dashboards and meeting scheduling. It is **not a production Zoom replacement**: real multi-person video/audio conferencing needs a signaling server, STUN/TURN infrastructure and security review. The meeting room UI is a functional lobby/interface, but this starter does not claim cloud recording, screen sharing, or robust group WebRTC are implemented. Do not deploy with the sample JWT secret; replace it and configure HTTPS before public use.


## Payment + Paid Meetings Upgrade
- User can create a meeting and set a fee in INR.
- User can discover paid meetings created by other users.
- User can pay and unlock the meeting room.
- User payment history: `/payment-history`.
- Admin payment center: `/admin-payments`.
- Every payment is stored in `meeting_payments`.
- Razorpay checkout is supported when `Razorpay:KeyId` and `Razorpay:KeySecret` are configured.
- If Razorpay keys are empty, local MeetSphere Pay is available for local testing only.

### Run
1. Start XAMPP MySQL.
2. Import `database/meetsphere.sql` into MySQL/phpMyAdmin.
3. Backend:
   `cd backend/MeetSphere.Api`
   `dotnet restore`
   `dotnet run`
4. Frontend:
   `cd frontend`
   `npm install`
   `npm start`
5. Open `http://localhost:4200`.

### Real Razorpay
Put your Razorpay test/live credentials in `backend/MeetSphere.Api/appsettings.json`:
`Razorpay:KeyId`
`Razorpay:KeySecret`
Never expose the secret key in Angular/frontend code.

## Latest UI/Auth update
- Login/Register/Admin Login/Admin Register pages do not show the public header or footer.
- After login, the User/Admin workspace keeps the MeetSphere sidebar layout.
- Admin console shows registered users, all meetings, and payment records from MySQL.
- Admin payment center is available at `/admin-payments`.
- User payment history is available at `/payment-history`.
- Frontend API base URL is `http://localhost:5001/api`.
- Admin registration is enabled and requires the setup key: `MEETSPHERE-ADMIN-2026`.
- If Razorpay keys are blank, the project uses the local MeetSphere Pay testing flow; configure Razorpay keys in `backend/MeetSphere.Api/appsettings.json` for Razorpay checkout.


## Final project hand-off notes
- User workspace: register/login, create and schedule meetings, discover other users' rooms, and view payment history.
- Admin workspace: manage registered users and meetings, and review payment records.
- Protected routes redirect unauthenticated visitors to the appropriate login page. A signed-in user cannot open admin pages, and admins are redirected away from user-only pages.
- Payment history and admin payment routes are wired to the existing backend payment endpoints. For paid meetings, a meeting must have a price greater than zero in the database; this starter's meeting creation form currently creates free meetings by default.
- The meeting room is a lobby with a shareable code, not a live audio/video conferencing implementation.
- Before public deployment, replace demo secrets/setup keys, restrict admin creation, configure HTTPS and CORS for your deployed domain, and use Razorpay test credentials before live payments.

### Database setup
Import `database/meetsphere.sql` into MySQL/phpMyAdmin. It creates the core tables and payment table. If you already have a database, back it up first, then apply any missing schema changes.

### Clean install
Do not copy a Windows `node_modules` folder to Linux/macOS. From `frontend`, run `npm ci` (or `npm install`) on your own machine, then `npm start`. The source archive intentionally omits generated `node_modules`, Angular cache, and .NET `bin/obj` build artifacts.


## Clean package / registration loading fix
- Duplicate backup folders, duplicate files named `(2)`, and generated `bin`, `obj`, `node_modules`, and Angular cache files were removed from this copy.
- Registration/login now stops the spinner after 15 seconds and shows a helpful error instead of staying on “Please wait…” forever.
- Database connection timeout is limited so a stopped MySQL server fails promptly.
- Configure your own SMTP app password in `backend/MeetSphere.Api/appsettings.json` (`Email:AppPassword`) if you use password reset. The original archive contained a mail credential, so it has been replaced with a placeholder in this clean copy.

### Run after extracting
1. Start MySQL in XAMPP and import `database/meetsphere.sql` in phpMyAdmin.
2. Backend terminal: `cd backend/MeetSphere.Api`, then `dotnet restore`, then `dotnet run --urls http://localhost:5001`.
3. Frontend terminal: `cd frontend`, then `npm install`, then `npm start`.
4. Open `http://localhost:4200`. Check `http://localhost:5001/api/health` to confirm the API is running.
