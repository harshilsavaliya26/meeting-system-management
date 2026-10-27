# MeetSphere: Payments and Forgot Password

## Payments
The project already contains the meeting checkout, payment history and Admin Payments pages. It supports Razorpay checkout when gateway keys are configured and an explicitly local simulated checkout when they are blank. The local simulation does not move real money.

For Razorpay test mode, set `Razorpay:KeyId` and `Razorpay:KeySecret` in `backend/MeetSphere.Api/appsettings.json` (or preferably environment variables `Razorpay__KeyId` and `Razorpay__KeySecret`). Keep the secret on the API only. Test the create-order -> checkout -> server signature verification flow before live mode.

## Forgot password
A new `/forgot-password` page sends a 6-digit code to the registered email. Codes expire after 10 minutes and are stored hashed. Run the updated `database/meetsphere.sql` against your MySQL database to create the `password_reset_codes` table.

Configure SMTP in `backend/MeetSphere.Api/appsettings.json` under `Email`, or via environment variables:
- `Email__SmtpServer` (default smtp.gmail.com)
- `Email__Port` (default 587)
- `Email__Username`
- `Email__AppPassword` (for Gmail use an app password)
- `Email__FromEmail`

The API returns a configuration error if SMTP is not configured. Do not commit real SMTP or Razorpay secrets to source control.

## Run
1. Start MySQL in XAMPP and import/update `database/meetsphere.sql`.
2. Run `dotnet run --urls http://localhost:5001` inside `backend/MeetSphere.Api`.
3. Run `npm ci` then `npm start` inside `frontend`.
4. Open `http://localhost:4200/forgot-password` to test recovery.
