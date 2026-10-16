import { apiFetch, apiPath, getErrorMessage } from "@/lib/api";
import type { PaginatedPosts, Post } from "@/lib/types";

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

export const postsService = {
  async getPosts({ skip = 0, limit = 10 }: GetPostsParams = {}): Promise<PaginatedPosts> {
    const res = await fetch(apiPath(`/api/posts?skip=${skip}&limit=${limit}`));
    if (!res.ok) {
      throw new Error(getErrorMessage(await res.json().catch(() => null)));
    }
    return res.json();
  },

  async getPostById(postId: string | number): Promise<Post> {
    const res = await fetch(apiPath(`/api/posts/${postId}`));
    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      const error = new Error(getErrorMessage(errorData)) as Error & { status?: number };
      error.status = res.status;
      throw error;
    }
    return res.json();
  },

  async createPost(payload: CreatePostPayload): Promise<Post> {
    const res = await apiFetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(getErrorMessage(await res.json().catch(() => null)));
    }
    return res.json();
  },

  async updatePost(postId: string | number, payload: UpdatePostPayload): Promise<Post> {
    const res = await apiFetch(`/api/posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      const error = new Error(getErrorMessage(errorData)) as Error & { status?: number };
      error.status = res.status;
      throw error;
    }
    return res.json();
  },

  async deletePost(postId: string | number): Promise<void> {
    const res = await apiFetch(`/api/posts/${postId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      const error = new Error(getErrorMessage(errorData)) as Error & { status?: number };
      error.status = res.status;
      throw error;
    }
  },

  async getUserPosts(
    userId: string | number,
    { skip = 0, limit = 10 }: GetPostsParams = {}
  ): Promise<PaginatedPosts> {
    const res = await fetch(
      apiPath(`/api/users/${userId}/posts?skip=${skip}&limit=${limit}`)
    );
    if (!res.ok) {
      throw new Error(getErrorMessage(await res.json().catch(() => null)));
    }
    return res.json();
  },
};
