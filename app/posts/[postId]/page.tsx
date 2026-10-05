"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Post } from "@/lib/types";
import { apiFetch, formatDate, getErrorMessage, apiPath } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { Modal, AlertModal } from "@/components/Modal";

export default function PostPage() {
  const { postId } = useParams<{ postId: string }>();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [edit, setEdit] = useState(false);
  const [del, setDel] = useState(false);
  const [title, setTitle] = useState(""),
    [content, setContent] = useState(""),
    [alert, setAlert] = useState<{
      kind: "success" | "error";
      message: string;
    } | null>(null),
    [loading, setLoading] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(apiPath(`/api/posts/${postId}`));
        if (!r.ok) throw new Error();
        const d = await r.json();
        setPost(d);
        setTitle(d.title);
        setContent(d.content);
        const u = await getCurrentUser();
        setUserId(u?.id ?? null);
      } catch {
        router.replace("/error?code=404");
      }
    })();
  }, [postId, router]);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await apiFetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      if (r.status === 401) {
        router.push("/login");
        return;
      }
      if (!r.ok) throw new Error(getErrorMessage(await r.json()));
      setPost(await r.json());
      setEdit(false);
      setAlert({ kind: "success", message: "Post updated successfully!" });
    } catch (e: any) {
      setAlert({
        kind: "error",
        message:
          e.message ||
          "Network error. Please check your connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  }
  async function remove() {
    setLoading(true);
    try {
      const r = await apiFetch(`/api/posts/${postId}`, { method: "DELETE" });
      if (r.status === 401) {
        router.push("/login");
        return;
      }
      if (!r.ok) throw new Error(getErrorMessage(await r.json()));
      router.push("/");
    } catch (e: any) {
      setAlert({ kind: "error", message: e.message });
    } finally {
      setLoading(false);
    }
  }
  if (!post) return <div className="loading">Loading post...</div>;
  const owner = userId === post.user_id;
  return (
    <>
      <article className="content-section article-card">
        <div className="article-layout">
          <img
            className="article-img"
            src={post.author.image_path}
            alt={`${post.author.username}'s profile picture`}
            width={64}
            height={64}
          />
          <div className="article-main">
            <div className="article-metadata">
              <Link href={`/users/${post.author.id}/posts`}>
                {post.author.username}
              </Link>
              <small>{formatDate(post.date_posted)}</small>
            </div>
            <h2 className="article-title">{post.title}</h2>
            <p className="article-content">{post.content}</p>
            {owner && (
              <div className="post-actions">
                <button className="btn secondary" onClick={() => setEdit(true)}>
                  Edit Post
                </button>
                <button
                  className="btn outline-danger"
                  onClick={() => setDel(true)}
                >
                  Delete Post
                </button>
              </div>
            )}
          </div>
        </div>
      </article>
      {edit && (
        <Modal title="Edit Post" onClose={() => setEdit(false)}>
          <form onSubmit={save}>
            <div className="modal-body">
              <label>
                Title
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </label>
              <label>
                Content
                <textarea
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
              </label>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn secondary"
                onClick={() => setEdit(false)}
              >
                Cancel
              </button>
              <button className="btn primary" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {del && (
        <Modal title="Delete Post?" danger onClose={() => setDel(false)}>
          <div className="modal-body">
            <p className="modal-message">
              Are you sure you want to delete this post? This action cannot be
              undone.
            </p>
          </div>
          <div className="modal-footer">
            <button className="btn secondary" onClick={() => setDel(false)}>
              Cancel
            </button>
            <button className="btn danger" onClick={remove} disabled={loading}>
              {loading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </Modal>
      )}
      {alert && (
        <AlertModal
          kind={alert.kind}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}
    </>
  );
}
