Status: ready-for-agent

# Specification: Deep Backend Adapter for External FastAPI Contract

## Problem Statement

When building and maintaining the frontend for the blog platform, developers and UI components currently suffer from significant architectural friction caused by an uncoordinated, shallow network layer. Four disparate modules duplicate HTTP mechanics, manual authentication header injection, query string formatting, and error message parsing.

More critically, quirks and invariants of the external, immutable FastAPI backend leak directly into the user interface:
- Callers must manually construct OAuth2 form payloads with a mandatory `username` key even when authenticating with email.
- Incoming avatar references arrive in conflicting formats (relative local paths, absolute local dev URLs, remote cloud storage URLs, or missing values), forcing UI views to carry ad-hoc string inspections and fallback logic.
- When an authentication token expires or becomes invalid, non-login requests receive a `401 Unauthorized` status that clears storage silently without notifying the application's authentication state, causing in-memory state desynchronization and forcing individual page handlers to inspect raw status codes and manually trigger redirects.
- Backend failures arrive with varied payload structures (string detail, array of Pydantic validation errors, or non-JSON responses), leading to fragile error parsing, inconsistent user notifications, and manual type casting in callers.

This shallowness increases cognitive load, fragments maintainer locality, and complicates automated testing by requiring mocks across multiple disjoint modules.

## Solution

Consolidate all external network interactions behind a single, deep **Backend Adapter** module at the network seam.

From the caller and developer perspective:
- All domain interactions (Posts, Users, Authentication) are initiated through a unified, cohesive Backend Adapter interface.
- The adapter automatically injects authentication credentials into outgoing requests and manages the credential lifecycle.
- When an existing session expires or is invalidated (a 401 response on an authenticated resource), the adapter triggers a centralized unauthorized event that automatically clears the application's authentication state and redirects to the login view, freeing individual page views from managing session revocation.
- Failed login attempts (401 on the credential exchange endpoint) are explicitly exempted from the global session revocation event, allowing login forms to handle invalid credentials cleanly in-place.
- The adapter normalizes all incoming User entities at the seam, guaranteeing a fully-qualified, renderable Avatar URL with a standard fallback placeholder so UI components never perform manual string inspection or path concatenation.
- The adapter intercepts non-2xx responses and transforms them into a first-class, strongly-typed **Backend Error** containing the HTTP status code, a normalized user-facing message, and structured field validation issues.
- The adapter provides a single canonical test seam that accepts configurable dependencies (such as custom fetch transports or credential stores), allowing callers and tests to substitute behavior reliably without brittle multi-module mocking.

## User Stories

1. As an unauthenticated visitor, I want to log in using my email or username and password, so that I can access my account without worrying about OAuth2 form encoding requirements.
2. As an unauthenticated visitor submitting invalid credentials, I want to see a clear "Incorrect username or password" validation message on the login form, so that I understand why my submission failed without triggering an unwanted session purge or navigation loop.
3. As an unauthenticated visitor, I want to register for a new account with a username, email, and password, so that I can author blog posts.
4. As a visitor who forgot their password, I want to request a reset link via email, so that I can regain access to my account.
5. As a visitor with a password reset token, I want to submit a new password, so that my account credentials are updated successfully.
6. As an authenticated user whose session token has expired, I want the application to immediately detect the expired session upon making any request and redirect me to the login view, so that I am never left in a broken or desynchronized state.
7. As a reader browsing the home feed, I want to view paginated lists of posts with author details, so that I can read content published by community members.
8. As a reader viewing a post, I want the author's avatar to always render reliably with an absolute image source or a clean fallback placeholder, so that broken image icons never appear.
9. As a reader searching for content, I want to filter posts by keywords in the title, body, or author username, so that I can quickly find relevant articles.
10. As a reader clicking on an author's name, I want to view that specific user's public profile and their paginated list of authored posts, so that I can explore their publications.
11. As a reader navigating to an invalid post URL, I want the system to recognize the 404 response through the adapter and display a clean not-found view, so that I am not trapped in an unhandled network error state.
12. As an authenticated author, I want to create a new post with a title and content, so that my thoughts are published to the blog feed.
13. As an authenticated author, I want to update the title or content of an existing post that I own, so that I can revise and improve my published writing.
14. As an authenticated author, I want to delete a post that I own, so that it is permanently removed from the blog.
15. As an authenticated user, I want to update my username and email address from my account settings, so that my identity details remain accurate.
16. As an authenticated user, I want to upload a new avatar image file, so that my profile displays my personalized picture across the blog.
17. As an authenticated user, I want to change my current account password, so that my account remains secure.
18. As an authenticated user, I want to permanently delete my account and associated data, so that my information is removed upon request.
19. As a user performing any action that fails due to backend validation (such as duplicate email or missing required fields), I want to receive an informative and friendly error message, so that I can correct my input.
20. As a frontend developer writing UI components, I want to interact with a single, cohesive Backend Adapter interface rather than importing separate scattered service files, so that my code remains decoupled from network implementation mechanics.
21. As a frontend developer writing automated tests, I want to configure or mock network interactions at a single adapter seam, so that unit and integration tests are robust, fast, and free of global monkey-patching.

## Implementation Decisions

- **Single Unified Module**: Replace the loose utility and service modules with a consolidated Backend Adapter module exposing cohesive sub-namespaces:
  - `posts`: handles post retrieval, pagination query formatting, post creation, modification, and deletion.
  - `users`: handles profile fetching, profile updates, avatar uploads, password changes, and account deletion.
  - `auth`: handles login credential exchange, user registration, forgot password requests, and password resets.
- **Single Test & Configuration Seam**: The Backend Adapter must accept an optional configuration object supporting dependency injection for base URL resolution, custom fetch implementations, and custom token storage. A pre-configured default instance is exported for general application usage.
- **Credential & Auth Header Management**: The adapter encapsulates reading, setting, and clearing authentication tokens. Tokens are automatically attached as `Authorization: Bearer <token>` headers to authenticated requests.
- **Unauthorized (401) Event Seam**: The adapter exposes an `onUnauthorized(callback)` subscription method:
  - When an authenticated request fails with an HTTP 401 response, the adapter automatically purges the stored token and invokes registered callbacks.
  - The login credential exchange endpoint (`/api/users/token`) is explicitly exempted from firing the unauthorized callback, ensuring credential rejections only produce an error response.
  - The application's authentication context registers a single subscriber to clear in-memory user state and navigate to the login route.
- **Avatar & Entity Normalization**:
  - The adapter transforms all raw backend user representations into a canonical domain model at the network seam:
    - Normalizes `avatarUrl` to a fully-qualified URL using the configured base URL when the backend provides relative paths, or falls back to a standardized placeholder path when null.
    - Preserves a backwards-compatible alias `image_path` pointing to `avatarUrl` during the transition period.
    - Strips deprecated backend-only artifacts (such as `image_file`).
- **Standardized Backend Error Class**:
  - Implement a `BackendError` class extending `Error`:
    - Properties include `status: number`, `message: string`, and optional `details: Record<string, string[]> | null`.
    - Normalizes string details, array validation formats from Pydantic (extracting field locations and messages), and non-JSON server error pages into clear, readable messages.
- **Deletion of Shallow Modules**:
  - Once callers and tests are migrated to use the Backend Adapter, all existing shallow service files and raw fetch utilities are deleted, completing the deletion test and concentrating complexity within the deep adapter.

## Testing Decisions

- **External Behavior Verification**: Tests will interact strictly with the public interface of the Backend Adapter and consumers, verifying returned domain entities, emitted unauthorized events, and thrown `BackendError` instances. Internal fetch wrappers and private helper functions will not be tested in isolation.
- **Adapter Unit Tests**: Comprehensive tests covering:
  - Successful dispatch and response parsing for all post, user, and auth operations.
  - Automatic `Authorization` header attachment when a token is present.
  - Avatar URL resolution across all variants: relative path, absolute localhost URL, remote cloud URL, and null.
  - Error normalization across HTTP status codes, structured validation arrays, detail strings, and network failures.
  - Global 401 notification emission on protected endpoints versus 401 error throwing on login requests.
- **Consumer Component & Context Integration Tests**:
  - `AuthContext` tested using the adapter's seam and `onUnauthorized` subscription.
  - UI pages and modals tested by providing mock responses or mock adapter instances at the single seam rather than spying on four loose service files.
- **Prior Art**: Builds on the existing test conventions in the repository using Vitest, React Testing Library, and mock fetch implementations.

## Out of Scope

- Modifying any backend endpoints, database schemas, or FastAPI business logic (the external backend is an immutable contract).
- Converting existing client-side pages into Next.js React Server Components or Server Actions (remains focused on the data layer and client state seam).
- Refactoring the internal pagination algorithms or modal implementations of the consuming page views (covered under separate future deepening candidates).
- Introducing third-party caching libraries (such as TanStack Query or SWR) during this initial deepening phase.

## Further Notes

- The Backend Adapter design strictly adheres to the deep module criteria: a minimal, intuitive interface concealing significant networking, authentication, normalization, and error handling complexity.
- All domain terminology conforms to the definitions established in `GLOSSARY.md`.
