# MeetSphere Zoom integration setup

The Automations page now includes integration cards and the Zoom information/activation flow. The final login button redirects to Zoom's official OAuth authorization page; MeetSphere never asks users to type their Zoom password into this app.

## Configure Zoom OAuth
1. Open https://marketplace.zoom.us/develop and create an OAuth app.
2. Add the redirect URL `http://localhost:4200/automations` for local development (and the matching production URL later).
3. Copy the OAuth Client ID into `zoomClientId` in `frontend/src/app/pages/workspace-tools.component.ts`.
4. Start frontend and backend, open Automations, choose Zoom, select organization or personal connection, then click **Log in to Zoom**.

This package implements the front-end authorization navigation only. A production OAuth integration still needs a backend callback to validate `state`, exchange the authorization code using the client secret stored server-side, save tokens securely, and handle Zoom API calls. Do not put the Zoom client secret in Angular.
