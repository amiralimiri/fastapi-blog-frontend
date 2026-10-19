# 01: Implement Core Feed Module and Invalidation Registry

**What to build:** A deep Feed state module and invalidation registry that encapsulates post fetching, cursor pagination, multi-field search filtering, initial/pagination loading flags, error recovery, and keyed cache invalidation behind an in-process hook seam with dependency injection support for testing.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Core module types defined for query options, invalidation filters, and feed result state
- [x] Invalidation registry maintains active subscriber callbacks and supports both global and user-targeted invalidation
- [x] Primary hook manages initial fetch, incremental cursor pagination, retry handling, and cleanup
- [x] Multi-field search filtering matches queries across post titles, post content, and author usernames
- [x] Dependency injection accepts an optional backend adapter with fallback to default backend singleton
- [x] Comprehensive unit test suite covers initial load, pagination, error recovery, search queries, and invalidation triggers
