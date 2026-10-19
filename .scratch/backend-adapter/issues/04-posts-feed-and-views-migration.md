# 04: Post Feed, Article View & Modal Migration

**What to build:** Migration of all post reading, creation, modification, and deletion features to the Backend Adapter. Listing views receive pre-formatted pagination queries, article views catch 404s cleanly via typed errors, and author avatars in cards display using normalized URLs.

**Blocked by:** 01: Core Backend Adapter & Error Normalizer

**Status:** ready-for-agent

- [x] Home feed uses `backend.posts.getPosts` with skip and limit parameters
- [x] Individual post page uses `backend.posts.getPostById`, `backend.posts.updatePost`, and `backend.posts.deletePost`
- [x] Missing post requests handle 404 `BackendError` instances cleanly by redirecting to the not-found view
- [x] User posts page uses `backend.posts.getUserPosts` and `backend.users.getUserById` through the adapter
- [x] `CreatePostModal` submits new articles via `backend.posts.createPost` with normalized error alerts
- [x] `PostCard` renders author avatar directly from `author.avatarUrl` with zero string parsing or host checking in JSX
- [x] Existing post tests pass against the new adapter seam
