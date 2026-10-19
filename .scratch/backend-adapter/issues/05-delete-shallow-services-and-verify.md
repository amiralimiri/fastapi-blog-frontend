# 05: Delete Obsolete Shallow Services & Final Seam Verification

**What to build:** Completion of the contract phase by permanently removing the four obsolete shallow files and raw HTTP helpers. All application code and tests run across the single canonical Backend Adapter seam with 100% test pass rate.

**Blocked by:** 03: User Profile & Account Settings Migration, 04: Post Feed, Article View & Modal Migration

**Status:** ready-for-agent

- [x] Obsolete shallow service files deleted: `lib/services/posts.service.ts`, `lib/services/users.service.ts`, `lib/services/auth.service.ts`, and `lib/services/index.ts`
- [x] Obsolete HTTP utility `lib/api.ts` deleted and its tests removed or migrated to adapter tests
- [x] Zero imports remain across `app/`, `components/`, and `context/` pointing to deleted service files
- [x] Canonical domain types in `lib/types.ts` reflect normalized domain entities (`avatarUrl`)
- [x] Entire test suite (`npm test`) executes 100% green across the single adapter seam
- [x] Application builds without TypeScript or ESLint errors (`npm run build`)
