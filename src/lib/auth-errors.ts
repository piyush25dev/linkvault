// One place for turning Firebase Auth error codes into readable messages.
export function friendlyAuthError(e: unknown): string {
  console.error(e);
  const code = (e as { code?: string })?.code ?? '';
  const map: Record<string, string> = {
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/user-not-found': 'No account found with that email.',
    'auth/wrong-password': 'Email or password is incorrect.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Choose a password with at least 6 characters.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/missing-email': 'Enter your email address.',
    'auth/requires-recent-login': 'For security, please sign out, sign in again, and retry.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
    'auth/unauthorized-domain': 'This domain is not authorized in Firebase (Authentication > Settings > Authorized domains).',
    'auth/operation-not-allowed': 'This sign-in method is not enabled in Firebase.',
    'auth/too-many-requests': 'Too many attempts. Try again in a few minutes.',
    'auth/network-request-failed': 'Network error. Check your connection.',
  };
  return map[code] ?? `Something went wrong${code ? ` (${code})` : ''}. Please try again.`;
}
