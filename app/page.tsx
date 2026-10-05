"use client";

import { apiPath } from "@/lib/api";
import { useEffect, useState } from "react";
import { PostCard } from "@/components/PostCard";
import type { PaginatedPosts } from "@/lib/types";

export default function HomePage() {
  const [data, setData] = useState<PaginatedPosts | null>(null);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const limit = 10;
  useEffect(() => {
    load(0, true);
  }, []);
  async function load(skip: number, replace = false) {
    setLoading(true);
    setError("");
    try {
      const r = await fetch(apiPath(`/api/posts?skip=${skip}&limit=${limit}`));
      if (!r.ok) throw new Error();
      const d = await r.json();
      setData((prev) =>
        replace ? d : { ...d, posts: [...(prev?.posts || []), ...d.posts] },
      );
      setOffset(skip + d.posts.length);
    } catch {
      setError(
        "Unable to load posts. Please check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }
  if (!data && loading) return <div className="loading">Loading posts...</div>;
  if (!data)
    return (
      <div className="loading error-text">
        <p>{error || "Unable to load posts."}</p>
        <button
          className="btn outline-primary"
          onClick={() => load(0, true)}
          disabled={loading}
        >
          Retry
        </button>
      </div>
    );
  return (
    <>
      {error && (
        <div className="content-section form-section">
          <p className="error-text">{error}</p>
          <button
            className="btn outline-primary"
            onClick={() => load(offset, false)}
            disabled={loading}
          >
            Retry
          </button>
        </div>
      )}
      <div id="postsContainer">
        {data.posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>
      {data.has_more && (
        <div className="load-more">
          <button
            className="btn outline-primary"
            disabled={loading}
            onClick={() => load(offset)}
          >
            {loading ? "Loading..." : "Load More Posts"}
          </button>
        </div>
      )}
    </>
  );
}
