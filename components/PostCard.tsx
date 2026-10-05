import Link from "next/link";
import type { Post } from "@/lib/types";
import { formatDate } from "@/lib/api";

export function PostCard({ post }: { post: Post }) {
  return (
    <article className="content-section article-card">
      <div className="article-layout">
        <img
          className="article-img"
          src={post.author.image_path}
          alt={`${post.author.username}'s profile picture`}
          width={64}
          height={64}
          loading="lazy"
        />
        <div className="article-main">
          <div className="article-metadata">
            <Link href={`/users/${post.author.id}/posts`}>
              {post.author.username}
            </Link>
            <small>{formatDate(post.date_posted)}</small>
          </div>
          <h2>
            <Link className="article-title" href={`/posts/${post.id}`}>
              {post.title}
            </Link>
          </h2>
          <p className="article-content">{post.content}</p>
        </div>
      </div>
    </article>
  );
}
