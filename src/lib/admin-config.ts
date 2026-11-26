// The super admin email is fixed in configuration. There is no UI or API that changes it.
// Works on the server (SUPER_ADMIN_EMAIL) and in the browser (NEXT_PUBLIC_SUPER_ADMIN_EMAIL, UI hint only).
export const SUPER_ADMIN_EMAIL = (process.env.SUPER_ADMIN_EMAIL || process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || '').trim().toLowerCase();
export const isAdminEmail = (email?: string | null) => !!SUPER_ADMIN_EMAIL && !!email && email.trim().toLowerCase() === SUPER_ADMIN_EMAIL;
