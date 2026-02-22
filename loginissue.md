# Login Issue Postmortem

## Summary
The admin login failure was not a single bug. It was a chain of auth and state-management problems across frontend, backend, and Supabase configuration.

## User-visible Symptoms
- Login repeatedly failed even when credentials looked correct.
- Errors varied between:
  - `Invalid email or password`
  - `Email not confirmed`
  - `Invalid login credentials`
- During temporary admin creation from UI, backend returned HTTP 400.

## Root Causes

### 1. Misleading frontend error handling
The login page initially collapsed many backend/Supabase failures into generic messages. This made it look like wrong credentials every time, even when the real cause was different (for example email confirmation or rate limiting).

### 2. Mixed auth models in admin frontend
The admin app originally mixed two different auth sources:
- backend JWT flow (`/api/auth/login` + `/api/auth/profile`)
- Supabase client auth session listener (`onAuthStateChange`)

These two systems can conflict and overwrite each other. The admin panel should use a single source of truth for session state. In this project, backend JWT is the correct source for admin dashboard access.

### 3. Supabase account state was inconsistent during attempts
Some auth attempts failed because the account in `auth.users` was not in a valid password-login state at that time (for example not confirmed, wrong email variant, or password not effectively set for that exact account).

Important model:
- Password hash is stored in `auth.users.encrypted_password`.
- `public.users` does not store passwords; it stores app profile data (`id`, `email`, `role`).

### 4. Registration was blocked by Supabase signup throttling
The temporary "create admin" path hit:
- `email rate limit exceeded`

That produced frontend 400 errors and prevented account bootstrap via normal `signUp` route.

### 5. Email mismatch risk (`gamil.com` vs `gmail.com`)
At one point, the working account was created as `id2013663@gamil.com`. Logging in with `gmail.com` would always fail, while `gamil.com` worked.

## Code Fixes Applied

### Backend auth fixes (`backend/routes/auth.js`)
- Normalized email input in register/login (`trim().toLowerCase()`).
- Improved auth error propagation so frontend can show real failure reasons.
- Added fallback registration path when Supabase returns rate-limit on sign-up:
  - Uses service-role admin create user.
  - Confirms email in fallback path.
  - Handles already-existing users by resolving auth user and ensuring `public.users` profile exists.

### Frontend auth fixes (`admin-dashboard/src/contexts/AuthContext.js`)
- Removed conflicting Supabase auth listener from admin dashboard auth state.
- Kept backend JWT as single auth source.
- Improved displayed login errors by forwarding backend/Supabase message.

### Temporary UI work (later removed)
- A temporary "Create Admin Account" section was added to `LoginPage` for debugging/bootstrapping.
- Per request, it was removed afterward and login page restored to sign-in only.

## Verification That Issue Was Resolved
- Direct backend register call succeeded for the admin account.
- Direct backend login call succeeded for the same credentials.
- Backend returned valid token + admin role payload.

## Final Lessons
1. Keep a single auth authority in each client app.
2. Do not hide backend auth messages behind generic text during debugging.
3. Normalize emails before auth operations.
4. Treat Supabase Auth (`auth.users`) and app profile table (`public.users`) as separate layers that must both be valid.
5. Add fallback handling for expected provider limits (for example signup throttling).
