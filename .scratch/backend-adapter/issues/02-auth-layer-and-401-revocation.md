# 02: Authentication Layer & Centralized 401 Revocation

**What to build:** Complete integration of the application's authentication context and auth flows with the Backend Adapter. When an active session token expires or is revoked, the application automatically clears authentication state and redirects to the login view in one centralized place, while invalid login credentials remain on the login form with actionable feedback.

**Blocked by:** 01: Core Backend Adapter & Error Normalizer

**Status:** ready-for-agent

- [x] `AuthProvider` uses the Backend Adapter for fetching the current user and managing token lifecycle
- [x] `AuthProvider` subscribes to the adapter's `onUnauthorized` seam at initialization, clearing user state and routing to `/login` when a 401 occurs
- [x] Login page delegates credential exchange to the Backend Adapter and displays returned `BackendError` messages without triggering global unauthorized navigation
- [x] Register page uses the adapter's auth namespace to create accounts and surface duplicate username/email validation errors
- [x] Forgot password and reset password pages consume the adapter's auth methods with normalized error and success handling
- [x] Unit and integration tests verify session hydration, unauthorized redirect reactions, and credential validation
