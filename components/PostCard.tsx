"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import type { Post } from "@/lib/types";
import type { NormalizedPost } from "@/lib/backend";
import { formatDate } from "@/lib/utils";
import { Calendar, User as UserIcon } from "lucide-react";

export function PostCard({ post }: { post: Post | NormalizedPost }) {
  const [imageError, setImageError] = useState(false);

  const avatarUrl = post.author.avatarUrl;

  return (
    <article className="content-section article-card hover:shadow-md transition-shadow">
      <div className="article-layout">
        <div className="relative w-16 h-16 shrink-0 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
          {!imageError ? (
            <Image
              className="object-cover"
              src={avatarUrl}
              alt={`${post.author.username}'s profile`}
              fill
              sizes="64px"
              onError={() => setImageError(true)}
              unoptimized
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
          <h2>
            <Link className="article-title font-bold text-xl block mt-1 hover:text-blue-600 transition-colors" href={`/posts/${post.id}`}>
              {post.title}
            </Link>
          </h2>
          <p className="article-content line-clamp-3 text-sm md:text-base mt-2 opacity-90 leading-relaxed">
            {post.content}
          </p>
        </div>
      </div>
    </article>
  );
}

