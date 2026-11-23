# LinkVault

A Next.js + TypeScript bookmark manager with Firebase Authentication, Cloud Firestore, Material UI, and persistent light/dark themes.

## Setup

1. Install Node.js 20+.
2. Run `npm install`.
3. Create a Firebase project at https://console.firebase.google.com/.
4. Enable **Authentication → Email/Password** and **Google** providers.
5. Create a **Cloud Firestore** database.
6. Copy `.env.example` to `.env.local` and fill in your Firebase web app configuration.
7. Publish `firestore.rules` in Firebase Console → Firestore Database → Rules.
8. Run `npm run dev` and open http://localhost:3000.

## Theme

Use the sun/moon button in the header or Settings page. The selected `light` or `dark` preference is stored in localStorage under `linkvault-theme`.

## Current implementation

- Landing page, email/password registration and login, Google sign-in.
- Protected dashboard routes.
- Firestore-backed bookmark create/list, search, favorite toggle, soft delete, restore, permanent delete.
- Firestore collection creation.
- Persistent Material UI light/dark theme.

## Next implementation steps

- Metadata extraction API (server-side Open Graph parsing with safe URL validation).
- Collection listing, editing, deletion, and assigning bookmarks.
- Pagination and richer sorting/filtering.
- User profile and account settings.
- Add automated tests and deploy to Vercel.

## Security notes

Firestore rules scope all user documents to the authenticated UID. Firebase client configuration is public by design; never put service-account credentials in `NEXT_PUBLIC_` variables. Consider App Check, rate limiting for metadata fetching, and URL/IP protections before public production deployment.

## REST API

The app includes authenticated Next.js Route Handlers under `src/app/api`. Send the Firebase ID token in `Authorization: Bearer <token>`; the server verifies it with Firebase Admin and derives the user ID from the verified token. Never send a trusted `userId` in the request body.

| Method | Endpoint | Description |
|---|---|---|
| GET, POST | `/api/bookmarks` | List (up to 200) and create bookmarks |
| GET, PATCH, DELETE | `/api/bookmarks/:id` | Read, update and permanently delete a bookmark |
| GET, POST | `/api/collections` | List and create collections |
| PATCH, DELETE | `/api/collections/:id` | Rename/update or delete a collection; bookmarks are uncategorized on collection deletion |
| GET | `/api/favorites` | List active favorites |
| GET | `/api/trash` | List deleted bookmarks |
| POST, DELETE | `/api/trash/:id` | Restore or permanently delete a trashed bookmark |
| GET | `/api/dashboard` | Dashboard counts and recent bookmarks |
| POST | `/api/metadata` | Fetch title, description, favicon and Open Graph image for a URL |

### Configure server authentication

1. In Firebase Console, create a service account and copy its project ID, client email and private key.
2. Add `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` to `.env.local` (server-only variables).
3. Keep the existing `NEXT_PUBLIC_FIREBASE_*` web configuration for client authentication.
4. Deploy `firestore.rules` with Firebase CLI. The Admin SDK bypasses Firestore client rules, so every API route verifies the caller's Firebase ID token and scopes queries to that UID.

### Example client call

Use `apiFetch` from `src/lib/api-client.ts` in client components:

```ts
import { apiFetch } from '@/lib/api-client';

const result = await apiFetch<{ id: string; message: string }>('/api/bookmarks', {
  method: 'POST',
  body: JSON.stringify({ url: 'https://nextjs.org', title: 'Next.js' }),
});
```

The metadata endpoint only accepts HTTP(S) URLs, blocks common private/local host patterns, does not follow redirects, and times out after eight seconds. Metadata retrieval is best-effort; users should be able to enter title and description manually when a site blocks automated requests.
