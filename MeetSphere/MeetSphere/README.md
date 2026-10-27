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
- Frontend API base URL is `http://localhost:5000/api`.
- Admin registration is enabled and requires the setup key: `MEETSPHERE-ADMIN-2026`.
- If Razorpay keys are blank, the project uses the local MeetSphere Pay testing flow; configure Razorpay keys in `backend/MeetSphere.Api/appsettings.json` for Razorpay checkout.
