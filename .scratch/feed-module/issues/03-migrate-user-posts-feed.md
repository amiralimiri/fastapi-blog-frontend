# 03: Migrate User Posts Profile Feed

**What to build:** The author profile post feed migrates to the deep Feed module scoped by author user ID, replacing manual pagination slicing and state management while maintaining user header display and navigation.

**Blocked by:** 01: Implement Core Feed Module and Invalidation Registry

**Status:** ready-for-agent

- [ ] User posts page delegates author post pagination and error state to the Feed module using the route user ID
- [ ] User profile information continues to load reliably and displays author metadata
- [ ] Initial pulse skeletons render during initial profile and post fetch
- [ ] Paginated post traversal appends older posts seamlessly via the Feed module interface
- [ ] Error notices and retry controls allow recovery from network failures
- [ ] User posts integration test suite passes completely with no regressions
