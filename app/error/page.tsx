"use client";
import { useEffect, useState } from "react";
export default function ErrorPage() {
  const [code, setCode] = useState("Error");
  useEffect(() => {
    setCode(new URLSearchParams(window.location.search).get("code") || "Error");
  }, []);
  return (
    <article className="content-section article-card">
      <h1>
        <span className="article-title">Oops... {code} Error</span>
      </h1>
      <p className="article-content">
        An error occurred. Please check your request and try again.
      </p>
    </article>
  );
}
