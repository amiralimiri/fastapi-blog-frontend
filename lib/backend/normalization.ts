import type {
  NormalizedPaginatedPosts,
  NormalizedPost,
  NormalizedUser,
} from "./types";

interface RawUser {
  id?: number;
  username?: string;
  email?: string;
  avatarUrl?: string;
  image_path?: string | null;
  image_file?: string | null;
  [key: string]: unknown;
}

interface RawPost {
  id?: number;
  user_id?: number;
  title?: string;
  content?: string;
  date_posted?: string;
  author?: RawUser;
  [key: string]: unknown;
}

interface RawPaginatedPosts {
  posts?: RawPost[];
  total?: number;
  skip?: number;
  limit?: number;
  has_more?: boolean;
  [key: string]: unknown;
}

export function normalizeAvatarUrl(
  rawPath: string | null | undefined,
  baseUrl: string
): string {
  if (!rawPath || typeof rawPath !== "string" || rawPath.trim() === "") {
    return "/default.jpg";
  }

  const trimmed = rawPath.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  const cleanBase = baseUrl.replace(/\/+$/, "");
  const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${cleanBase}${cleanPath}`;
}

export function normalizeUser(rawUser: RawUser, baseUrl: string): NormalizedUser {
  const rawPath =
    typeof rawUser.avatarUrl === "string"
      ? rawUser.avatarUrl
      : typeof rawUser.image_path === "string"
      ? rawUser.image_path
      : typeof rawUser.image_file === "string"
      ? rawUser.image_file
      : null;
  const avatarUrl = normalizeAvatarUrl(rawPath, baseUrl);

  return {
    id: Number(rawUser.id) || 0,
    username: String(rawUser.username || ""),
    email: rawUser.email !== undefined ? String(rawUser.email) : undefined,
    avatarUrl,
    image_path: avatarUrl,
  };
}

export function normalizePost(rawPost: RawPost, baseUrl: string): NormalizedPost {
  return {
    id: Number(rawPost.id) || 0,
    user_id: Number(rawPost.user_id) || 0,
    title: String(rawPost.title || ""),
    content: String(rawPost.content || ""),
    date_posted: String(rawPost.date_posted || ""),
    author: normalizeUser(rawPost.author || {}, baseUrl),
  };
}

export function normalizePaginatedPosts(
  rawPaginated: RawPaginatedPosts,
  baseUrl: string
): NormalizedPaginatedPosts {
  return {
    posts: Array.isArray(rawPaginated.posts)
      ? rawPaginated.posts.map((post) => normalizePost(post, baseUrl))
      : [],
    total: rawPaginated.total ?? 0,
    skip: rawPaginated.skip ?? 0,
    limit: rawPaginated.limit ?? 0,
    has_more: Boolean(rawPaginated.has_more),
  };
}
