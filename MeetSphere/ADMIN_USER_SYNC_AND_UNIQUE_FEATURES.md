MeetSphere - Updated Admin/User Sync Notes

Changes included:
- User dashboard refreshes meeting and payment data automatically every 10 seconds while open.
- When an admin edits or deletes a meeting in the database, the user's dashboard picks up the latest server data without a manual browser refresh.
- The refresh timer is cleaned up when leaving the dashboard.

Already present in this project:
- Admin-only API endpoints for editing meeting title/price and deleting users/meetings.
- Admin user list with meeting/payment totals.
- User's own meetings and payment history APIs.

Important:
- Admin edits/deletes affect the shared MySQL database, so users see the change on their next refresh (up to about 10 seconds on the dashboard).
- Run the existing database SQL script and configure the backend database connection before testing.
- Payment gateway completion requires valid Razorpay credentials; don't treat a demo/test payment as a real charge.

Suggested unique features for a BCA project:
1. Admin Activity Audit Trail: record who edited/deleted which record and when.
2. Meeting Change Alerts: show a banner when a meeting's title, price, or schedule changes.
3. Meeting Feedback + rating after attendance.
4. Cancellation and refund request workflow.
5. Attendance report and downloadable CSV/PDF.
6. Duplicate-meeting warning based on title and scheduled time.
