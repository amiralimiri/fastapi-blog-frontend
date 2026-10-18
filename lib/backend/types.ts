import type { PaginatedPosts, Post, User } from "@/lib/types";

export type NormalizedUser = Omit<User, "image_file"> & {
  avatarUrl: string;
  image_path: string;
  image_file?: never;
};

export type NormalizedPost = Omit<Post, "author"> & {
  author: NormalizedUser;
};

export type NormalizedPaginatedPosts = Omit<PaginatedPosts, "posts"> & {
  posts: NormalizedPost[];
};

export interface BackendTokenStorage {
  getToken(): string | null;
  setToken(token: string): void;
  clearToken(): void;
}

export interface BackendAdapterConfig {
  baseUrl?: string;
  fetch?: typeof fetch;
  tokenStorage?: BackendTokenStorage;
}

export interface GetPostsParams {
  skip?: number;
  limit?: number;
}

export interface CreatePostPayload {
  title: string;
  content: string;
}

export interface UpdatePostPayload {
  title?: string;
  content?: string;
}

export interface UpdateProfilePayload {
  username?: string;
  email?: string;
}

export type UpdateUserPayload = UpdateProfilePayload;

export interface ChangePasswordPayload {
  current_password?: string;
  new_password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface ResetPasswordPayload {
  token: string;
  new_password: string;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
}

export interface BackendAdapter {
  getToken(): string | null;
  setToken(token: string): void;
  clearToken(): void;
  onUnauthorized(callback: () => void): () => void;

  posts: {
    getPosts(params?: GetPostsParams): Promise<NormalizedPaginatedPosts>;
    getPostById(postId: string | number): Promise<NormalizedPost>;
    getUserPosts(userId: string | number, params?: GetPostsParams): Promise<NormalizedPaginatedPosts>;
    createPost(payload: CreatePostPayload): Promise<NormalizedPost>;
    updatePost(postId: string | number, payload: UpdatePostPayload): Promise<NormalizedPost>;
    deletePost(postId: string | number): Promise<void>;
  };

  users: {
    getCurrentUser(): Promise<NormalizedUser>;
    getUserById(userId: string | number): Promise<NormalizedUser>;
    updateProfile(userId: string | number, payload: UpdateProfilePayload): Promise<NormalizedUser>;
    uploadProfilePicture(userId: string | number, file: File): Promise<NormalizedUser>;
    changePassword(payload: ChangePasswordPayload): Promise<void>;
    deleteAccount(userId: string | number): Promise<void>;
  };

  auth: {
    login(emailOrUsername: string, password: string): Promise<AuthTokenResponse>;
    register(payload: RegisterPayload): Promise<NormalizedUser>;
    forgotPassword(email: string): Promise<void>;
    resetPassword(payload: ResetPasswordPayload): Promise<void>;
  };
}
