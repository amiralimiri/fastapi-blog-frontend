# 03: User Profile & Account Settings Migration

**What to build:** Migration of user identity management, avatar uploads, password changes, and account deletion to the Backend Adapter. Form inputs are isolated from background context re-fetches to prevent in-flight text overwrites, and profile avatars render directly from the normalized URL without manual path concatenation.

**Blocked by:** 02: Authentication Layer & Centralized 401 Revocation

**Status:** ready-for-agent

- [x] Account settings page calls `backend.users.updateProfile` for profile information updates
- [x] In-flight form edits are preserved and no longer overwritten by background user sync re-renders
- [x] Avatar image uploads use `backend.users.uploadProfilePicture`, with preview URLs cleaned up reliably
- [x] Profile picture rendering consumes normalized `avatarUrl` directly, eliminating manual `startsWith("http")` string heuristics and environment prefixing
- [x] Password updates use `backend.users.changePassword` with input validation and normalized error messages
- [x] Account deletion executes through `backend.users.deleteAccount`, safely revoking session state and redirecting home
- [x] Account page test suite updated and passing 100% green without race conditions or state overwrite failures
