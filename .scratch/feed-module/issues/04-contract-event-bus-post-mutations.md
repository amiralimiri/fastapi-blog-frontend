# 04: Contract Global Event Bus in Post Mutations and Finalize Invalidation

**What to build:** Post mutation workflows in the creation modal and post detail view invoke the type-safe invalidation function across the seam upon creating or deleting posts, completely removing the untyped browser DOM window event bus.

**Blocked by:** 
- 02: Migrate Home Feed and Search Presentation
- 03: Migrate User Posts Profile Feed

**Status:** ready-for-agent

- [ ] Post creation in the modal triggers feed invalidation through the Feed module invalidation function upon success
- [ ] Post deletion in the post detail page triggers scoped feed invalidation through the Feed module invalidation function upon success
- [ ] Untyped `window.dispatchEvent(new Event("postsUpdated"))` and DOM listeners are completely eliminated from the codebase
- [ ] Active feeds automatically refresh without requiring page navigation or manual reloads
- [ ] Modal, post detail, and feed integration test suites pass completely with no remaining references to the window event bus
