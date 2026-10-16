"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, getErrorMessage } from "@/lib/api";
import { Modal } from "./Modal";
import { toast } from "sonner";
import {
  Menu,
  X,
  Sun,
  Moon,
  Monitor,
  ChevronDown,
  PlusCircle,
  User as UserIcon,
  LogIn,
  UserPlus,
} from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const [menu, setMenu] = useState(false);
  const [themeMenu, setThemeMenu] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | "auto">("auto");
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);

  const themeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("theme") as "light" | "dark" | "auto" | null;
    if (saved) setTheme(saved);
  }, []);

  useEffect(() => {
    const isDark =
      theme === "dark" ||
      (theme === "auto" &&
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-color-scheme: dark)")?.matches);

    document.documentElement.dataset.bsTheme = isDark ? "dark" : "light";
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    setMenu(false);
    setThemeMenu(false);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setThemeMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function createPost(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Please enter both title and content");
      return;
    }

    setPosting(true);
    try {
      const r = await apiFetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      if (!r.ok) throw new Error(getErrorMessage(await r.json()));
      setCreateOpen(false);
      setTitle("");
      setContent("");
      toast.success("Post created successfully!");
      router.push("/");
      router.refresh();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("postsUpdated"));
      }
    } catch (e: unknown) {
      toast.error(
        e instanceof Error ? e.message : "Network error. Please try again."
      );
    } finally {
      setPosting(false);
    }
  }

  const renderThemeIcon = () => {
    if (theme === "light") return <Sun size={15} />;
    if (theme === "dark") return <Moon size={15} />;
    return <Monitor size={15} />;
  };

  return (
    <div className="site-root">
      <header className="site-header">
        <nav className="navbar">
          <div className="nav-container">
            <Link className="brand flex items-center gap-2 font-bold tracking-tight" href="/">
              FastAPI Blog
            </Link>

            <button
              className="nav-toggle flex items-center justify-center p-1.5"
              onClick={() => setMenu((v) => !v)}
              aria-label="Toggle navigation"
            >
              {menu ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div className={`nav-content ${menu ? "open" : ""}`}>
              <div className="nav-left">
                <Link
                  href="/"
                  className={`nav-link ${pathname === "/" ? "active" : ""}`}
                >
                  Home
                </Link>
              </div>

              <div className="nav-right">
                {user ? (
                  <>
                    <button
                      className="btn outline-light inline-flex items-center gap-1.5 text-sm"
                      onClick={() => setCreateOpen(true)}
                    >
                      <PlusCircle size={16} />
                      <span>New Post</span>
                    </button>
                    <Link
                      className="btn light inline-flex items-center gap-1.5 text-sm"
                      href="/account"
                    >
                      <UserIcon size={16} />
                      <span>{user.username}</span>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      className="btn outline-light inline-flex items-center gap-1.5 text-sm"
                      href="/login"
                    >
                      <LogIn size={16} />
                      <span>Login</span>
                    </Link>
                    <Link
                      className="btn light inline-flex items-center gap-1.5 text-sm"
                      href="/register"
                    >
                      <UserPlus size={16} />
                      <span>Register</span>
                    </Link>
                  </>
                )}

                <div className="theme-wrap" ref={themeRef}>
                  <button
                    className="theme-button flex items-center gap-1.5"
                    onClick={() =>
                      setTheme(
                        theme === "light"
                          ? "dark"
                          : theme === "dark"
                          ? "auto"
                          : "light"
                      )
                    }
                    title="Toggle Theme"
                  >
                    {renderThemeIcon()}
                    <span className="capitalize text-xs">{theme}</span>
                  </button>
                  <button
                    className="theme-caret flex items-center justify-center"
                    onClick={() => setThemeMenu((v) => !v)}
                    aria-label="Theme options"
                  >
                    <ChevronDown size={14} />
                  </button>
                  <div className={`theme-menu ${themeMenu ? "open" : ""}`}>
                    <button
                      onClick={() => {
                        setTheme("light");
                        setThemeMenu(false);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Sun size={15} /> Light
                    </button>
                    <button
                      onClick={() => {
                        setTheme("dark");
                        setThemeMenu(false);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Moon size={15} /> Dark
                    </button>
                    <button
                      onClick={() => {
                        setTheme("auto");
                        setThemeMenu(false);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Monitor size={15} /> Auto
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </header>
      <main className="container">
        <div className="page-grid">
          <section>{children}</section>
          <aside>
            <div className="content-section sidebar">
              <h3>Our Sidebar</h3>
              <p>You can put any information here you'd like.</p>
              <ul>
                <li>Latest Posts</li>
                <li>Announcements</li>
                <li>Calendars</li>
                <li>etc</li>
              </ul>
            </div>
          </aside>
        </div>
      </main>
      <footer>
        <div className="container footer-inner">
          © {new Date().getFullYear()} Corey Schafer
        </div>
      </footer>
      {createOpen && (
        <Modal title="New Post" onClose={() => setCreateOpen(false)}>
          <form onSubmit={createPost}>
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
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  required
                />
              </label>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn secondary"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </button>
              <button className="btn primary" disabled={posting}>
                {posting ? "Posting..." : "Post"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
