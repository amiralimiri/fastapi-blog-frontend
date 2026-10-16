"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "./Modal";
import { postsService } from "@/lib/services";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreatePostModal({
  isOpen,
  onClose,
  onSuccess,
}: CreatePostModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Please enter both title and content");
      return;
    }

    setPosting(true);
    try {
      await postsService.createPost({ title, content });

      setTitle("");
      setContent("");
      toast.success("Post created successfully!");
      onClose();
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/");
        router.refresh();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("postsUpdated"));
        }
      }
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Network error. Please try again."
      );
    } finally {
      setPosting(false);
    }
  }

  return (
    <Modal title="New Post" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <label>
            Title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your article a clear title"
              required
              autoFocus
            />
          </label>
          <label>
            Content
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              placeholder="Write your article content here..."
              required
            />
          </label>
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn secondary"
            onClick={onClose}
            disabled={posting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn primary inline-flex items-center gap-1.5"
            disabled={posting}
          >
            {posting && <Loader2 size={16} className="animate-spin" />}
            <span>{posting ? "Publishing..." : "Publish Post"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
