"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { CreatePostModal } from "./CreatePostModal";
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
  BookOpen,
  Sparkles,
} from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const [menu, setMenu] = useState(false);
  const [themeMenu, setThemeMenu] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | "auto">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme") as "light" | "dark" | "auto" | null;
      if (saved) return saved;
    }
    return "auto";
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMenu(false);
    setThemeMenu(false);
  }

  const themeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isDark =
      theme === "dark" ||
      (theme === "auto" &&
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-color-scheme: dark)")?.matches);

    document.documentElement.classList.toggle("dark", !!isDark);
    document.documentElement.dataset.bsTheme = isDark ? "dark" : "light";
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setThemeMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
              <BookOpen size={20} className="opacity-90" />
              <span>FastAPI Blog</span>
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
            <div className="content-section sidebar space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-steel" />
                <h3 className="m-0 text-base font-bold">Community Blog</h3>
              </div>
              <p className="text-sm opacity-90 leading-relaxed m-0">
                A modern blogging platform powered by FastAPI and Next.js. Share your stories, read tech articles, and connect with authors.
              </p>
              <div className="pt-3 border-t border-border">
                <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                  Navigation
                </h4>
                <ul className="text-sm space-y-1.5 list-none p-0 m-0">
                  <li>
                    <Link href="/" className="hover:underline flex items-center gap-1.5">
                      <span>• All Articles</span>
                    </Link>
                  </li>
                  {user && (
                    <>
                      <li>
                        <Link href="/account" className="hover:underline flex items-center gap-1.5">
                          <span>• Account Settings</span>
                        </Link>
                      </li>
                      <li>
                        <Link href={`/users/${user.id}/posts`} className="hover:underline flex items-center gap-1.5">
                          <span>• My Articles</span>
                        </Link>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <footer>
        <div className="container footer-inner text-sm">
          © {new Date().getFullYear()} FastAPI Blog. Built with Next.js & FastAPI.
        </div>
      </footer>

      <CreatePostModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  );
}
