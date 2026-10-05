"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { apiFetch, getErrorMessage } from "@/lib/api";
import type { User } from "@/lib/types";
import { Modal, AlertModal } from "./Modal";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [menu, setMenu] = useState(false);
  const [themeMenu, setThemeMenu] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | "auto">("auto");
  const [createOpen, setCreateOpen] = useState(false);
  const [alert, setAlert] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    getCurrentUser().then(setUser);
    const saved = localStorage.getItem("theme") as any;
    setTheme(saved || "auto");
  }, []);
  useEffect(() => {
    const dark =
      theme === "dark" ||
      (theme === "auto" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.bsTheme = dark ? "dark" : "light";
    localStorage.setItem("theme", theme);
  }, [theme]);

  async function createPost(e: React.FormEvent) {
    e.preventDefault();
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
      setAlert({ kind: "success", message: "Post created successfully!" });
      router.push("/");
      router.refresh();
    } catch (e: any) {
      setAlert({
        kind: "error",
        message:
          e.message ||
          "Network error. Please check your connection and try again.",
      });
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="site-root">
      <header className="site-header">
        <nav className="navbar">
          <div className="nav-container">
            <Link className="brand" href="/">
              FastAPI Blog
            </Link>
            <button
              className="nav-toggle"
              onClick={() => setMenu((v) => !v)}
              aria-label="Toggle navigation"
            >
              ☰
            </button>
            <div className={`nav-content ${menu ? "open" : ""}`}>
              <div className="nav-left">
                <Link href="/" className="nav-link active">
                  Home
                </Link>
              </div>
              <div className="nav-right">
                {user ? (
                  <>
                    <button
                      className="btn outline-light"
                      onClick={() => setCreateOpen(true)}
                    >
                      New Post
                    </button>
                    <Link className="btn light" href="/account">
                      {user.username}
                    </Link>
                  </>
                ) : (
                  <>
                    <Link className="btn outline-light" href="/login">
                      Login
                    </Link>
                    <Link className="btn light" href="/register">
                      Register
                    </Link>
                  </>
                )}
                <div className="theme-wrap">
                  <button
                    className="theme-button"
                    onClick={() =>
                      setTheme(
                        theme === "light"
                          ? "dark"
                          : theme === "dark"
                            ? "auto"
                            : "light",
                      )
                    }
                  >
                    🌗 {theme[0].toUpperCase() + theme.slice(1)}
                  </button>
                  <button
                    className="theme-caret"
                    onClick={() => setThemeMenu((v) => !v)}
                    aria-label="Theme options"
                  >
                    ⌄
                  </button>
                  <div className={`theme-menu ${themeMenu ? "open" : ""}`}>
                    <button
                      onClick={() => {
                        setTheme("light");
                        setThemeMenu(false);
                      }}
                    >
                      🌝 Light
                    </button>
                    <button
                      onClick={() => {
                        setTheme("dark");
                        setThemeMenu(false);
                      }}
                    >
                      🌚 Dark
                    </button>
                    <button
                      onClick={() => {
                        setTheme("auto");
                        setThemeMenu(false);
                      }}
                    >
                      🌗 Auto
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
      {alert && (
        <AlertModal
          kind={alert.kind}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}
    </div>
  );
}
