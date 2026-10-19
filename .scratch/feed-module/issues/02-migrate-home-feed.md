# 02: Migrate Home Feed and Search Presentation

**What to build:** The home feed interface migrates to the deep Feed module, replacing manual offset state machines, append logic, and duplicate search filtering with the unified hook interface while retaining responsive skeleton loading and pagination retry behavior.

**Blocked by:** 01: Implement Core Feed Module and Invalidation Registry

**Status:** ready-for-agent

- [ ] Home page delegates post fetching, cursor pagination, and search filtering to the Feed module
- [ ] Initial pulse skeleton displays cleanly during initial load
- [ ] Incremental "Load more" pagination button reflects background loading spinner and remaining post availability
- [ ] Error messages display with retry actions for both initial load failure and incremental pagination failure
- [ ] Search input binds seamlessly to the Feed module query filter with empty search result handling
- [ ] Home page integration test suite passes completely with no regressions
