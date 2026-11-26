# Super admin setup

1. Add to `.env.local` (and to Vercel > Settings > Environment Variables), same value in both:
   ```
   SUPER_ADMIN_EMAIL=you@yourdomain.com
   NEXT_PUBLIC_SUPER_ADMIN_EMAIL=you@yourdomain.com
   ```
   The Firebase Admin variables (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`) must be set too.
2. Add this line to `scripts` in `package.json`:  `"seed:admin": "node scripts/seed-super-admin.mjs"`
3. Create the account (once):  `npm run seed:admin -- --password="A-strong-password"`
   Forgot it later? `npm run seed:admin -- --password="New-password" --reset`
4. Deploy the new `firestore.rules`:  `firebase deploy --only firestore:rules`
5. Sign in at `/login` with the admin email. You are taken to `/admin`.
6. Optional: `GOOGLE_SAFE_BROWSING_API_KEY` adds malware and phishing detection.

## How the admin identity is protected
- The email is fixed in server configuration. No screen or API changes it.
- Admin rights need the fixed email AND a server-set claim (`superAdmin`). Registering that email gives nothing; the seed script creates the real account first, so the email is already taken.
- The admin account cannot be suspended or deleted, and its email cannot be edited through the admin API.
- The password can be changed in Admin > Settings (current password required).
- Every `/api/admin/*` route re-checks the admin on the server. The `/admin` redirect in the browser is only for convenience.

## Data written by the app
| Where | What |
|---|---|
| `users/{uid}` | profile: role, status, warnings, login count, last login |
| `activityLogs` | one entry per sign-in, bookmark/collection action, and admin action |
| `flags` | one review-queue entry per suspicious link |
| `settings/moderation` | mode (flag or block) and custom blocklists / allowlist |
