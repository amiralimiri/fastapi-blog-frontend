"use client";

import { apiPath } from "@/lib/api";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PostCard } from "@/components/PostCard";
import type { PaginatedPosts, User } from "@/lib/types";
export default function UserPosts() {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<User | null>(null),
    [data, setData] = useState<PaginatedPosts | null>(null),
    [offset, setOffset] = useState(0),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  const limit = 10;
  async function loadInitial() {
    setError("");
    setLoading(true);
    try {
      const [u, p] = await Promise.all([
        fetch(apiPath(`/api/users/${userId}`)),
        fetch(apiPath(`/api/users/${userId}/posts?skip=0&limit=${limit}`)),
      ]);
      if (!u.ok || !p.ok) throw new Error();
      const [userData, d] = await Promise.all([u.json(), p.json()]);
      setUser(userData);
      setData(d);
      setOffset(d.posts.length);
    } catch {
      setError(
        "Unable to load this user's posts. Please check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError("");
      try {
        const [u, p] = await Promise.all([
          fetch(apiPath(`/api/users/${userId}`)),
          fetch(apiPath(`/api/users/${userId}/posts?skip=0&limit=${limit}`)),
        ]);
        if (!u.ok || !p.ok) throw new Error();
        const [userData, d] = await Promise.all([u.json(), p.json()]);
        if (!cancelled) {
          setUser(userData);
          setData(d);
          setOffset(d.posts.length);
        }
      } catch {
        if (!cancelled)
          setError(
            "Unable to load this user's posts. Please check your connection and try again.",
          );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);
  async function more() {
    setLoading(true);
    setError("");
    try {
      const r = await fetch(
        apiPath(`/api/users/${userId}/posts?skip=${offset}&limit=${limit}`),
      );
      if (!r.ok) throw new Error();
      const d = await r.json();
      setData((prev) =>
        prev ? { ...d, posts: [...prev.posts, ...d.posts] } : d,
      );
      setOffset(offset + d.posts.length);
    } catch {
      setError("Unable to load more posts. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  if (!user || !data)
    return (
      <div className="loading">
        {error ? (
          <>
            <p className="error-text">{error}</p>
            <button
              className="btn outline-primary"
              onClick={loadInitial}
              disabled={loading}
            >
              {loading ? "Retrying..." : "Retry"}
            </button>
          </>
        ) : (
          "Loading posts..."
        )}
      </div>
    );
  return (
    <>
      <h1 className="page-title">Posts by {user.username}</h1>
      {error && (
        <div className="content-section form-section">
          <p className="error-text">{error}</p>
          <button
            className="btn outline-primary"
            onClick={more}
            disabled={loading}
          >
            Retry
          </button>
        </div>
      )}
      <div>
        {data.posts.length ? (
          data.posts.map((p) => <PostCard key={p.id} post={p} />)
        ) : (
          <p className="muted">No posts by this user yet.</p>
        )}
      </div>
      {data.has_more && (
        <div className="load-more">
          <button
            className="btn outline-primary"
            disabled={loading}
            onClick={more}
          >
            {loading ? "Loading..." : "Load More Posts"}
          </button>
        </div>
      )}
    </>
  );
}
