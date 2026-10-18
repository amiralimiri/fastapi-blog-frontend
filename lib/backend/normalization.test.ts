import { describe, it, expect } from "vitest";
import { normalizeUser, normalizePost, normalizePaginatedPosts } from "./normalization";

describe("Seam 4: User & Avatar Entity Normalization", () => {
  const baseUrl = "http://127.0.0.1:8000";

  it("normalizes relative avatar path to fully-qualified URL using base URL", () => {
    const rawUser = {
      id: 1,
      username: "alice",
      email: "alice@example.com",
      image_file: "alice.jpg",
      image_path: "/profile_pics/alice.jpg",
    };

    const user = normalizeUser(rawUser, baseUrl);
    expect(user.avatarUrl).toBe("http://127.0.0.1:8000/profile_pics/alice.jpg");
    expect(user.image_path).toBe("http://127.0.0.1:8000/profile_pics/alice.jpg");
    expect(user.username).toBe("alice");
    expect(user.id).toBe(1);
    expect(user.email).toBe("alice@example.com");
  });

  it("preserves already absolute avatar URLs without modification", () => {
    const rawUser = {
      id: 2,
      username: "bob",
      image_file: null,
      image_path: "https://cdn.example.com/avatars/bob.png",
    };

    const user = normalizeUser(rawUser, baseUrl);
    expect(user.avatarUrl).toBe("https://cdn.example.com/avatars/bob.png");
    expect(user.image_path).toBe("https://cdn.example.com/avatars/bob.png");
  });

  it("resolves absolute localhost URL variants without altering host or port", () => {
    const rawUser = {
      id: 4,
      username: "dev_user",
      image_file: null,
      image_path: "http://localhost:8000/profile_pics/dev.jpg",
    };

    const user = normalizeUser(rawUser, baseUrl);
    expect(user.avatarUrl).toBe("http://localhost:8000/profile_pics/dev.jpg");
    expect(user.image_path).toBe("http://localhost:8000/profile_pics/dev.jpg");
  });

  it("falls back to /default.jpg when avatar is null, empty or undefined", () => {
    const rawUser = {
      id: 3,
      username: "charlie",
      image_file: null,
      image_path: null,
    };

    const user = normalizeUser(rawUser, baseUrl);
    expect(user.avatarUrl).toBe("/default.jpg");
    expect(user.image_path).toBe("/default.jpg");
  });

  it("normalizes nested post author avatar URL", () => {
    const rawPost = {
      id: 10,
      user_id: 1,
      title: "First Post",
      content: "Hello world",
      date_posted: "2026-01-01T00:00:00Z",
      author: {
        id: 1,
        username: "alice",
        image_file: "alice.jpg",
        image_path: "/profile_pics/alice.jpg",
      },
    };

    const post = normalizePost(rawPost, baseUrl);
    expect(post.author.avatarUrl).toBe("http://127.0.0.1:8000/profile_pics/alice.jpg");
    expect(post.author.image_path).toBe("http://127.0.0.1:8000/profile_pics/alice.jpg");
  });

  it("normalizes lists of posts in PaginatedPosts", () => {
    const rawPaginated = {
      posts: [
        {
          id: 1,
          user_id: 1,
          title: "Post 1",
          content: "Content 1",
          date_posted: "2026-01-01T00:00:00Z",
          author: {
            id: 1,
            username: "alice",
            image_file: null,
            image_path: null,
          },
        },
      ],
      total: 1,
      skip: 0,
      limit: 10,
      has_more: false,
    };

    const paginated = normalizePaginatedPosts(rawPaginated, baseUrl);
    expect(paginated.posts[0].author.avatarUrl).toBe("/default.jpg");
  });
});
