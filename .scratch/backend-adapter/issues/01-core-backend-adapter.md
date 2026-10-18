# 01: Core Backend Adapter & Error Normalizer

**What to build:** A unified, deep Backend Adapter module that serves as the single network seam to the external FastAPI backend. It encapsulates credential lifecycle and token injection, transforms FastAPI validation and HTTP failures into a typed Backend Error, normalizes avatar paths into fully-qualified URLs with fallback placeholders, and exposes an unauthorized event subscriber that exempts login credential exchanges.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] Unified `backend` adapter instance exported with `posts`, `users`, and `auth` sub-namespaces
- [x] Accepts configurable dependencies (custom `fetch`, base URL, and custom token storage) for deterministic testing without global mocks
- [x] Automatically injects `Authorization: Bearer <token>` when an access token is stored
- [x] `BackendError` class encapsulates HTTP status code, user-friendly message, and optional validation field errors
- [x] Normalizes Pydantic error arrays, string details, and non-JSON backend error payloads into human-readable messages
- [x] Dispatches global unauthorized callbacks on 401 responses for protected resources while clearing stored credentials
- [x] Explicitly exempts `/api/users/token` from the unauthorized callback, raising a `BackendError` for invalid login credentials instead
- [x] Normalizes User entities at the seam so `avatarUrl` is always a displayable absolute URL or `/default.jpg` fallback, maintaining `image_path` as a compatibility alias
- [x] Comprehensive unit test suite covering operations, error transformations, auth token injection, and normalization
