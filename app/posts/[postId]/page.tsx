"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Post } from "@/lib/types";
import { apiFetch, formatDate, getErrorMessage, apiPath } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Modal } from "@/components/Modal";
import { toast } from "sonner";
import {
  Calendar,
  User as UserIcon,
  Edit3,
  Trash2,
  Loader2,
  ArrowLeft,
} from "lucide-react";

export default function PostPage() {
  const { postId } = useParams<{ postId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [edit, setEdit] = useState(false);
  const [del, setDel] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const fetchPost = useCallback(async () => {
    try {
      setPageLoading(true);
      const r = await fetch(apiPath(`/api/posts/${postId}`));
      if (!r.ok) {
        if (r.status === 404) {
          router.replace("/not-found");
          return;
        }
        throw new Error();
      }
      const d: Post = await r.json();
      setPost(d);
      setTitle(d.title);
      setContent(d.content);
    } catch {
      toast.error("Failed to load post. It may have been removed.");
      router.replace("/");
    } finally {
      setPageLoading(false);
    }
  }, [postId, router]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content cannot be empty.");
      return;
    }

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
      const updated: Post = await r.json();
      setPost(updated);
      setEdit(false);
      toast.success("Post updated successfully!");
    } catch (e: unknown) {
      toast.error(
        e instanceof Error ? e.message : "Network error. Please try again."
      );
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
      toast.success("Post deleted successfully!");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("postsUpdated"));
      }
      router.push("/");
    } catch (e: unknown) {
      toast.error(
        e instanceof Error ? e.message : "An error occurred while deleting."
      );
    } finally {
      setLoading(false);
    }
  }

  if (pageLoading || !post) {
    return (
      <article className="content-section article-card animate-pulse py-8">
        <div className="article-layout">
          <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
          <div className="article-main flex-1 space-y-4">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
            <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded w-full" />
          </div>
        </div>
      </article>
    );
  }

  const owner = user?.id === post.user_id;
  const imageSrc = post.author.image_path || "/default.jpg";

  return (
    <>
      <div className="mb-4">
        <Link
          href="/"
          className="text-sm font-medium inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to all posts</span>
        </Link>
      </div>
      <article className="content-section article-card">
        <div className="article-layout">
          <div className="relative w-16 h-16 shrink-0 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
            {!imageError ? (
              <Image
                className="object-cover"
                src={imageSrc}
                alt={`${post.author.username}'s profile`}
                fill
                sizes="64px"
                onError={() => setImageError(true)}
                unoptimized={imageSrc.startsWith("http://127.0.0.1") || imageSrc.startsWith("http://localhost")}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <UserIcon size={32} />
              </div>
            )}
          </div>

          <div className="article-main">
            <div className="article-metadata flex items-center gap-3">
              <Link
                href={`/users/${post.author.id}/posts`}
                className="font-semibold hover:underline inline-flex items-center gap-1"
              >
                <UserIcon size={14} className="opacity-70" />
                <span>{post.author.username}</span>
              </Link>
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1 opacity-75">
                <Calendar size={13} />
                <time dateTime={post.date_posted}>{formatDate(post.date_posted)}</time>
              </span>
            </div>

            <h1 className="article-title text-2xl md:text-3xl font-bold mt-2 mb-4 leading-tight">
              {post.title}
            </h1>
            <div className="article-content whitespace-pre-line text-base leading-relaxed opacity-90">
              {post.content}
            </div>

            {owner && (
              <div className="post-actions flex items-center gap-2 pt-4 mt-6 border-t border-border">
                <button
                  className="btn secondary inline-flex items-center gap-1.5 text-sm"
                  onClick={() => setEdit(true)}
                >
                  <Edit3 size={15} />
                  <span>Edit Post</span>
                </button>
                <button
                  className="btn outline-danger inline-flex items-center gap-1.5 text-sm"
                  onClick={() => setDel(true)}
                >
                  <Trash2 size={15} />
                  <span>Delete Post</span>
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
                  placeholder="Post title"
                  required
                />
              </label>
              <label>
                Content
                <textarea
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Post content"
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
              <button className="btn primary inline-flex items-center gap-1.5" disabled={loading}>
                {loading && <Loader2 size={15} className="animate-spin" />}
                <span>{loading ? "Saving..." : "Save Changes"}</span>
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
            <button
              className="btn secondary"
              onClick={() => setDel(false)}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className="btn danger inline-flex items-center gap-1.5"
              onClick={remove}
              disabled={loading}
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              <span>{loading ? "Deleting..." : "Delete"}</span>
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
