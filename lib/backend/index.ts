export { BackendError } from "./errors";
export type { BackendErrorDetails } from "./errors";
export { createBackendAdapter, backend } from "./adapter";
export {
  normalizeUser,
  normalizePost,
  normalizePaginatedPosts,
  normalizeAvatarUrl,
} from "./normalization";
export type {
  BackendAdapter,
  BackendAdapterConfig,
  BackendTokenStorage,
  NormalizedUser,
  NormalizedPost,
  NormalizedPaginatedPosts,
  GetPostsParams,
  CreatePostPayload,
  UpdatePostPayload,
  UpdateProfilePayload,
  ChangePasswordPayload,
  RegisterPayload,
  ResetPasswordPayload,
  AuthTokenResponse,
} from "./types";
