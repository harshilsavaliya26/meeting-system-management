# MeetSphere Admin/User Sync and Unique Features

## Admin controls already present
- Admin can search/select user and meeting records, view details, edit user name/email/role and meeting title/price, and delete records through authenticated API endpoints.
- The admin console refreshes its users, meetings and payment overview every 10 seconds.
- Discover refreshes meeting data every 15 seconds; server-side changes appear without a manual browser reload. Deleted users lose access when the API no longer finds their account.

## Added: Shared Platform Announcement
- Admin publishes an announcement through `POST /api/announcements`.
- The announcement is stored in MySQL, not only in one browser's localStorage.
- All signed-in users can read the latest active announcement through `GET /api/announcements`; Discover checks for changes every 15 seconds.
- A new announcement deactivates the previous active announcement. Admin can dismiss an announcement through `DELETE /api/announcements/{id}`.
- The API creates the `platform_announcements` table automatically on first use.

## Suggested next unique features
1. Admin audit trail for every edit/delete (admin ID, action, old/new values, timestamp).
2. Meeting cancellation and refund-request workflow.
3. Ratings and feedback after a meeting ends.
4. Revenue report with date range and CSV export.
5. Soft-delete/restore for meetings to avoid accidental permanent loss.

## Run and verify
1. Start MySQL and the .NET API.
2. Start the Angular frontend and sign in as an admin.
3. Publish a platform announcement in the Admin Console.
4. Sign in as a normal user and open Discover; the banner should appear.
5. Edit/delete a meeting in Admin and confirm it appears updated/removed in Discover within about 15 seconds.

Note: Verify the database connection and build in your local environment before submission. Payment gateway behavior still depends on valid Razorpay credentials and server-side payment verification.
