# MeetSphere payment integration notes

- The existing page structure and styles are retained; a checkout modal has been added to Discover Meetings.
- Payment history and admin payment pages already read from the `meeting_payments` table.
- Blank Razorpay credentials activate the existing local demo endpoint. This is a simulation, not real-money processing.
- For real payment testing, configure Razorpay TEST keys on the API server and test the order -> Razorpay Checkout -> signature verification flow.
- With Razorpay configured, the API validates the checkout signature and confirms captured status, order, currency and amount against Razorpay before marking the transaction Paid. The local demo endpoint is blocked when gateway keys are configured.
- The API must be reachable at the URL configured in `frontend/src/app/services.ts`; the default is `http://localhost:5000/api`.
- SQL schema is in `database/meetsphere.sql`.

## Payment display fix
The backend now auto-migrates an older `meeting_payments` table by adding missing payment columns. Both `/api/payments/mine` and `/api/payments/admin` run the migration before reading records. Admin Payment Audit also shows API errors instead of silently displaying an empty table.

If you still have an old database and want to force the migration manually, run `PAYMENT_DATABASE_FIX.sql` in MySQL Workbench/phpMyAdmin, then restart the backend.
